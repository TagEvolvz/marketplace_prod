import winston from 'winston';
import path from 'path';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

// ─── Log directory ────────────────────────────────────────────────────────────
const LOG_DIR = process.env.LOG_DIR || 'logs';
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug');

// ─── Custom dev format ────────────────────────────────────────────────────────
const devFormat = printf(({ level, message, timestamp, stack, requestId, ...meta }) => {
  const rid = requestId ? ` [${requestId}]` : '';
  const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp}${rid} [${level}]: ${stack || message}${extra}`;
});

// ─── Logger instance ─────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'marketplace-api' },
  transports: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      maxsize: 5_242_880, // 5 MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      maxsize: 5_242_880,
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(LOG_DIR, 'exceptions.log') }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(LOG_DIR, 'rejections.log') }),
  ],
});

// ─── Console transport for non-production ─────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'HH:mm:ss' }),
        devFormat
      ),
    })
  );
}

// ─── HTTP request logger (morgan-compatible stream) ───────────────────────────
export const httpLogStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// ─── Helpers for structured logging ──────────────────────────────────────────

/** Log an incoming request with a unique request ID. */
export const logRequest = (
  method: string,
  url: string,
  statusCode: number,
  durationMs: number,
  requestId?: string
) => {
  logger.http('HTTP Request', { method, url, statusCode, durationMs, requestId });
};

/** Log an error with optional request context. */
export const logError = (
  err: Error,
  context?: { requestId?: string; userId?: string; method?: string; url?: string }
) => {
  logger.error(err.message, {
    stack: err.stack,
    name: err.name,
    ...context,
  });
};

export default logger;

