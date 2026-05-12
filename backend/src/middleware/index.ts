import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import rateLimit from 'express-rate-limit';
import { verifyAccessToken } from '../config/jwt';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { AuthenticatedRequest, UserRole } from '../types';
import logger from '../utils/logger';

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw ApiError.unauthorized('Access token required');
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId);
    if (!user) throw ApiError.unauthorized('User no longer exists');
    if (!user.isActive) throw ApiError.forbidden('Account has been deactivated');
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    next(ApiError.unauthorized('Invalid or expired token'));
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId);
      if (user?.isActive) req.user = user;
    }
  } catch { /* non-auth requests proceed */ }
  next();
};

// ─── RBAC ──────────────────────────────────────────────────────────────────────
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Access denied for role: ${req.user.role}`));
    }
    next();
  };
};

export const isAdmin    = authorize('admin');
export const isCustomer = authorize('customer', 'admin');

// ─── Error handler ─────────────────────────────────────────────────────────────
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let errors: { field: string; message: string }[] | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
    const map: Record<number, string> = {
      400: 'BAD_REQUEST', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN',
      404: 'NOT_FOUND', 409: 'CONFLICT', 422: 'VALIDATION_ERROR',
      429: 'RATE_LIMITED', 500: 'INTERNAL_ERROR',
    };
    code = map[statusCode] ?? 'UNKNOWN_ERROR';
  } else if (err.name === 'CastError') {
    statusCode = 400; message = 'Invalid ID format'; code = 'INVALID_ID';
  } else if ((err as NodeJS.ErrnoException).code === '11000') {
    statusCode = 409; message = 'Duplicate value'; code = 'DUPLICATE_VALUE';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401; message = 'Invalid token'; code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401; message = 'Token has expired'; code = 'TOKEN_EXPIRED';
  }

  if (statusCode === 500) {
    logger.error('Unhandled error', {
      requestId: (req as AuthenticatedRequest).requestId,
      path: req.path,
      error: err.message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && statusCode === 500 && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound(`Route ${req.method} ${req.path} not found`));
};

// ─── Rate limiters ─────────────────────────────────────────────────────────────
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: { success: false, message: 'Too many requests', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Allow higher limits in development to avoid blocking during local testing.
  max: process.env.NODE_ENV === 'development'
    ? parseInt(process.env.AUTH_RATE_LIMIT_MAX || '1000')
    : parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10'),
  message: { success: false, message: 'Too many auth attempts', code: 'RATE_LIMITED' },
  skipSuccessfulRequests: true,
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many requests', code: 'RATE_LIMITED' },
});

export const asyncHandler =
  (fn: Function) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
