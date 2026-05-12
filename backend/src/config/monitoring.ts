/**
 * monitoring.ts
 *
 * Sentry is fully optional. If SENTRY_DSN is not set this module is a no-op.
 * The @sentry/node package is NOT required — this file uses a require() call
 * at runtime only when SENTRY_DSN is present, which avoids TypeScript errors
 * when the package is not installed.
 */

import logger from '../utils/logger';
import { Request, Response, NextFunction } from 'express';

export const initMonitoring = async (): Promise<void> => {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) {
    logger.info('Sentry not configured — skipping (set SENTRY_DSN to enable)');
    return;
  }

  try {
    // Runtime require — only runs if package is installed AND SENTRY_DSN is set
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/node');
    Sentry.init({ dsn, environment: process.env.NODE_ENV || 'development', tracesSampleRate: 0.1 });
    logger.info('Sentry initialised');
  } catch {
    logger.warn('Sentry package not installed — error tracking disabled. Run: npm install @sentry/node');
  }
};

// No-op error handler — replaced by real one only if Sentry is configured
export const sentryErrorHandler = (
  _err: Error,
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(_err);
};
