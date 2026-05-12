/**
 * auth.service.test.ts
 *
 * Unit tests — no database connection required.
 * All Mongoose models and external dependencies are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../models/User', () => {
  const UserMock = {
    findOne: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  };
  const UserConstructor = vi.fn().mockImplementation((data: unknown) => ({
    ...data,
    save: vi.fn().mockResolvedValue(true),
  }));
  Object.assign(UserConstructor, UserMock);
  return { User: UserConstructor };
});

vi.mock('../config/jwt', () => ({
  generateTokenPair: vi.fn().mockReturnValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  }),
  verifyRefreshToken: vi.fn(),
}));

vi.mock('../config/email', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ─── Imports after mocks ───────────────────────────────────────────────────────

import { User } from '../models/User';
import { generateTokenPair, verifyRefreshToken } from '../config/jwt';
import { ApiError } from '../utils/ApiError';
import AuthService from '../services/auth.service';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  _id: 'user-id-1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  role: 'customer',
  isActive: true,
  isEmailVerified: true,
  refreshTokens: [] as string[],
  comparePassword: vi.fn().mockResolvedValue(true),
  save: vi.fn().mockResolvedValue(true),
  toObject: vi.fn().mockReturnThis(),
  ...overrides,
});

const registerPayload = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  password: 'Password1!',
};

const loginPayload = { email: 'jane@example.com', password: 'Password1!' };

// ─── Register ─────────────────────────────────────────────────────────────────

describe('AuthService.register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 409 CONFLICT when the email is already registered', async () => {
    vi.mocked(User.findOne).mockResolvedValueOnce(makeUser() as never);

    await expect(AuthService.register(registerPayload)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('creates a user document when the email is free', async () => {
    vi.mocked(User.findOne).mockResolvedValueOnce(null);
    vi.mocked(User.create).mockResolvedValueOnce(makeUser() as never);

    await AuthService.register(registerPayload);

    expect(User.create).toHaveBeenCalledOnce();
  });

  it('returns accessToken and refreshToken on success', async () => {
    vi.mocked(User.findOne).mockResolvedValueOnce(null);
    vi.mocked(User.create).mockResolvedValueOnce(makeUser() as never);

    const result = await AuthService.register(registerPayload);

    expect(result.accessToken).toBe('mock-access-token');
    expect(result.refreshToken).toBe('mock-refresh-token');
  });
});

// ─── Login ─────────────────────────────────────────────────────────────────────

describe('AuthService.login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 401 for an unrecognised email', async () => {
    vi.mocked(User.findOne).mockResolvedValueOnce(null);

    await expect(AuthService.login(loginPayload)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('throws 401 when password does not match', async () => {
    const user = makeUser({ comparePassword: vi.fn().mockResolvedValueOnce(false) });
    vi.mocked(User.findOne).mockResolvedValueOnce(user as never);

    await expect(AuthService.login(loginPayload)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('throws 403 for a deactivated account', async () => {
    const user = makeUser({ isActive: false });
    vi.mocked(User.findOne).mockResolvedValueOnce(user as never);

    await expect(AuthService.login(loginPayload)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('returns tokens and user object on valid credentials', async () => {
    const user = makeUser({ refreshTokens: [] });
    vi.mocked(User.findOne).mockResolvedValueOnce(user as never);

    const result = await AuthService.login(loginPayload);

    expect(result.accessToken).toBe('mock-access-token');
    expect(result).toHaveProperty('user');
    expect(generateTokenPair).toHaveBeenCalledOnce();
  });

  it('persists the new refresh token on the user document', async () => {
    const user = makeUser({ refreshTokens: [] });
    vi.mocked(User.findOne).mockResolvedValueOnce(user as never);

    await AuthService.login(loginPayload);

    expect(user.refreshTokens).toContain('mock-refresh-token');
    expect(user.save).toHaveBeenCalledOnce();
  });
});

// ─── Refresh token ─────────────────────────────────────────────────────────────

describe('AuthService.refreshToken', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 401 when called with no token', async () => {
    await expect(
      AuthService.refreshToken(undefined as unknown as string)
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 when the token is not on the user record (replay / revoked)', async () => {
    vi.mocked(verifyRefreshToken).mockReturnValueOnce({ userId: 'user-id-1' } as never);
    const user = makeUser({ refreshTokens: ['completely-different-token'] });
    vi.mocked(User.findById).mockResolvedValueOnce(user as never);

    await expect(AuthService.refreshToken('stale-token')).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('returns a new access token when the refresh token is valid', async () => {
    const refreshToken = 'valid-refresh-token';
    vi.mocked(verifyRefreshToken).mockReturnValueOnce({ userId: 'user-id-1' } as never);
    const user = makeUser({ refreshTokens: [refreshToken] });
    vi.mocked(User.findById).mockResolvedValueOnce(user as never);

    const result = await AuthService.refreshToken(refreshToken);

    expect(result.accessToken).toBe('mock-access-token');
  });

  it('rotates the refresh token (old one removed, new one stored)', async () => {
    const oldToken = 'old-refresh-token';
    vi.mocked(verifyRefreshToken).mockReturnValueOnce({ userId: 'user-id-1' } as never);
    const user = makeUser({ refreshTokens: [oldToken] });
    vi.mocked(User.findById).mockResolvedValueOnce(user as never);

    await AuthService.refreshToken(oldToken);

    expect(user.refreshTokens).not.toContain(oldToken);
    expect(user.refreshTokens).toContain('mock-refresh-token');
    expect(user.save).toHaveBeenCalledOnce();
  });
});

// ─── Logout ────────────────────────────────────────────────────────────────────

describe('AuthService.logout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('removes only the specific session token from the user', async () => {
    const targetToken = 'session-token';
    const otherToken = 'other-session-token';
    const user = makeUser({ refreshTokens: [targetToken, otherToken] });
    vi.mocked(User.findById).mockResolvedValueOnce(user as never);

    await AuthService.logout('user-id-1', targetToken);

    expect(user.refreshTokens).not.toContain(targetToken);
    expect(user.refreshTokens).toContain(otherToken);
    expect(user.save).toHaveBeenCalledOnce();
  });

  it('resolves without throwing when user is not found', async () => {
    vi.mocked(User.findById).mockResolvedValueOnce(null);

    await expect(AuthService.logout('nonexistent-id', 'tok')).resolves.not.toThrow();
  });
});

// ─── ApiError class ────────────────────────────────────────────────────────────

describe('ApiError', () => {
  it('constructs with correct statusCode and message', () => {
    const err = new ApiError(400, 'Bad input');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Bad input');
    expect(err).toBeInstanceOf(Error);
  });

  it('static helpers set correct status codes', () => {
    expect(ApiError.badRequest('x').statusCode).toBe(400);
    expect(ApiError.unauthorized('x').statusCode).toBe(401);
    expect(ApiError.forbidden('x').statusCode).toBe(403);
    expect(ApiError.notFound('x').statusCode).toBe(404);
    expect(ApiError.conflict('x').statusCode).toBe(409);
    expect(ApiError.internal('x').statusCode).toBe(500);
  });

  it('includes a validation errors array when provided', () => {
    const errors = [{ field: 'email', message: 'Invalid email' }];
    const err = ApiError.badRequest('Validation failed', errors);
    expect(err.errors).toEqual(errors);
  });
});
