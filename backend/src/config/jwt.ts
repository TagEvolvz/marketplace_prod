import jwt, { SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { UserRole } from '../types';

interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

interface RefreshTokenPayload {
  userId: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as SignOptions['expiresIn'],
    issuer: 'marketplace-api',
    audience: 'marketplace-client',
  });
};

export const generateRefreshToken = (userId: string | Types.ObjectId): string => {
  return jwt.sign(
    { userId: userId.toString() } as RefreshTokenPayload,
    process.env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
      issuer: 'marketplace-api',
    }
  );
};

// Convenience helper: generate both access and refresh tokens for a user payload
export const generateTokenPair = (payload: TokenPayload): { accessToken: string; refreshToken: string } => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload.userId);
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET as string, {
    issuer: 'marketplace-api',
    audience: 'marketplace-client',
  }) as TokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string, {
    issuer: 'marketplace-api',
  }) as RefreshTokenPayload;
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
};
