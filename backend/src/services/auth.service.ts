import crypto from 'crypto';
import { Types } from 'mongoose';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { generateTokenPair, verifyRefreshToken } from '../config/jwt';
import { sendEmail, emailTemplates } from '../utils/email';
import { generateRandomToken, hashToken } from '../utils/helpers';
import { IUser, UserRole } from '../types';
import logger from '../utils/logger';

interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: UserRole;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Partial<IUser>;
}

export class AuthService {
  // Helper to support both Mongoose Query objects and mocked functions that
  // directly return a Promise/result in tests. If the returned value has a
  // `.select` method we call it, otherwise await the value directly.
  private async resolveQuery<T = any>(maybeQuery: any, fields?: string): Promise<T | null> {
    if (!maybeQuery) return null;
    if (typeof maybeQuery.select === 'function') {
      // call select on the Query and await the result
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return await maybeQuery.select(fields);
    }
    // maybeQuery is already a Promise or direct value
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await maybeQuery;
  }
  // ─── Register ───────────────────────────────────────────────────────────────
  async register(payload: RegisterPayload): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    const { firstName, lastName, email, password, role = 'customer' } = payload;

    const existing = await User.findOne({ email });
    if (existing) throw ApiError.conflict('Email already registered');

    const verificationToken = generateRandomToken();
    const hashedToken = hashToken(verificationToken);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      emailVerificationToken: hashedToken,
    });

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${email}`;

    try {
      const { subject, html } = emailTemplates.welcomeEmail(firstName, verificationLink);
      await sendEmail({ to: email, subject, html });
    } catch (err) {
      logger.warn('Failed to send verification email:', err);
    }

    logger.info(`New user registered: ${email} [${role}]`);

    const { accessToken, refreshToken } = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { message: 'Registration successful. Please verify your email.', accessToken, refreshToken };
  }

  // ─── Login ───────────────────────────────────────────────────────────────────
  async login(payload: LoginPayload): Promise<AuthTokens> {
    const { email, password } = payload;

    const user = await this.resolveQuery(User.findOne({ email }), '+password +refreshTokens');

    if (!user) throw ApiError.unauthorized('Invalid email or password');
    if (!user.isActive) throw ApiError.forbidden('Account has been deactivated. Contact support.');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw ApiError.unauthorized('Invalid email or password');

    const { accessToken, refreshToken } = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    user.refreshTokens = [...(user.refreshTokens || []), refreshToken];
    await user.save();

    logger.info(`User logged in: ${email}`);

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  // ─── Refresh Token ───────────────────────────────────────────────────────────
  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!token) throw ApiError.unauthorized('Refresh token required');

    let payload: { userId: string };
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await this.resolveQuery(User.findById(payload.userId), '+refreshTokens');
    if (!user) throw ApiError.unauthorized('User not found');
    if (!user.refreshTokens?.includes(token)) {
      // Token reuse detected — invalidate all tokens
      user.refreshTokens = [];
      await user.save();
      throw ApiError.unauthorized('Token reuse detected. Please login again.');
    }

    // Rotate refresh token
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    user.refreshTokens = user.refreshTokens.filter((t: string) => t !== token);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────
  async logout(userId: string, refreshToken?: string): Promise<void> {
    const user = await this.resolveQuery(User.findById(userId), '+refreshTokens');
    if (!user) return;

    if (refreshToken) {
      user.refreshTokens = (user.refreshTokens || []).filter((t: string) => t !== refreshToken);
    } else {
      user.refreshTokens = []; // Logout all sessions
    }
    await user.save();
    logger.info(`User logged out: ${user.email}`);
  }

  // ─── Verify Email ────────────────────────────────────────────────────────────
  async verifyEmail(token: string, email: string): Promise<{ message: string }> {
    const hashedToken = hashToken(token);
    const user = await this.resolveQuery(
      User.findOne({
        email,
        emailVerificationToken: hashedToken,
      }),
      '+emailVerificationToken'
    );

    if (!user) throw ApiError.badRequest('Invalid or expired verification token');
    if (user.isEmailVerified) return { message: 'Email already verified' };

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  // ─── Forgot Password ─────────────────────────────────────────────────────────
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email exists, a reset link has been sent.' };

    const resetToken = generateRandomToken();
    const hashedToken = hashToken(resetToken);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

    try {
      const { subject, html } = emailTemplates.passwordReset(user.firstName, resetLink);
      await sendEmail({ to: email, subject, html });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw ApiError.internal('Failed to send reset email. Try again later.');
    }

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  // ─── Reset Password ──────────────────────────────────────────────────────────
  async resetPassword(token: string, email: string, newPassword: string): Promise<{ message: string }> {
    const hashedToken = hashToken(token);

    const user = await this.resolveQuery(
      User.findOne({
        email,
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
      }),
      '+passwordResetToken +passwordResetExpires +refreshTokens'
    );

    if (!user) throw ApiError.badRequest('Invalid or expired reset token');

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // Invalidate all sessions on password change
    await user.save();

    logger.info(`Password reset for user: ${email}`);
    return { message: 'Password reset successfully. Please login.' };
  }

  // ─── Change Password ─────────────────────────────────────────────────────────
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const user = await this.resolveQuery(User.findById(userId), '+password +refreshTokens');
    if (!user) throw ApiError.notFound('User not found');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

    user.password = newPassword;
    user.refreshTokens = []; // Force re-login everywhere
    await user.save();

    return { message: 'Password changed successfully. Please login again.' };
  }

  // ─── Get Me ──────────────────────────────────────────────────────────────────
  async getMe(userId: string): Promise<Partial<IUser>> {
    const user = await User.findById(userId).populate('wishlist', 'name images price slug');
    if (!user) throw ApiError.notFound('User not found');
    return this.sanitizeUser(user);
  }

  // ─── Update Profile ──────────────────────────────────────────────────────────
  async updateProfile(
    userId: string,
    updates: Partial<Pick<IUser, 'firstName' | 'lastName' | 'phone' | 'avatar' | 'addresses'>>
  ): Promise<Partial<IUser>> {
    const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
    if (!user) throw ApiError.notFound('User not found');
    return this.sanitizeUser(user);
  }

  // ─── Add to Wishlist ─────────────────────────────────────────────────────────
  async toggleWishlist(userId: string, productId: string): Promise<{ added: boolean }> {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const productObjectId = new Types.ObjectId(productId);
    const idx = user.wishlist.findIndex((id) => id.toString() === productId);

    if (idx === -1) {
      user.wishlist.push(productObjectId);
      await user.save();
      return { added: true };
    } else {
      user.wishlist.splice(idx, 1);
      await user.save();
      return { added: false };
    }
  }


  // ─── Get user by ID ──────────────────────────────────────────────────────────
  async getUserById(userId: string): Promise<Partial<IUser>> {
    const user = await this.resolveQuery(
      User.findById(userId),
      '-password -refreshTokens -emailVerificationToken -passwordResetToken'
    );
    if (!user) throw ApiError.notFound('User not found');
    return user.toObject();
  }

  // ─── Get wishlist ─────────────────────────────────────────────────────────────
  async getWishlist(userId: string): Promise<unknown[]> {
    const user = await User.findById(userId).populate('wishlist', 'name price effectivePrice images slug storeSection status');
    if (!user) throw ApiError.notFound('User not found');
    return user.wishlist as unknown[];
  }

  // ─── Helper ──────────────────────────────────────────────────────────────────
  private sanitizeUser(user: IUser): Partial<IUser> {
    const { password, refreshTokens, emailVerificationToken, passwordResetToken, ...safe } =
      user.toObject();
    return safe;
  }
}

export default new AuthService();
