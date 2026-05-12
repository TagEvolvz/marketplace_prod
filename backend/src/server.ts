/**
 * server.ts — FLOW single-store API
 * Sections: Pharmacy | Supermarket | Cosmetics
 */

import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// Prefer reliable public DNS servers for SRV lookups (fixes local resolver timeouts)
dns.setServers(['8.8.8.8', '1.1.1.1']);

// 1. Validate env vars first — exits with clear error if anything missing
import './config/env';

import 'express-async-errors';

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';

import { connectDB } from './config/database';
import { connectRedis } from './config/redis';
import { initMonitoring } from './config/monitoring';
import routes from './routes/index';
import { errorHandler, notFoundHandler, generalLimiter } from './middleware/index';
import { requestId } from './middleware/requestId';
import logger from './utils/logger';
import { env } from './config/env';

// Ensure uncaught errors are visible in the console for easier debugging
process.on('uncaughtException', (err) => {
  // Log to console first (nodemon/ts-node capture), then structured logger
  // eslint-disable-next-line no-console
  console.error('Uncaught exception:', err && (err.stack || err));
  try { logger.error('Uncaught exception', { error: err }); } catch {};
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection:', reason);
  try { logger.error('Unhandled Rejection', { reason }); } catch {};
  process.exit(1);
});

const app  = express();
const http_server = http.createServer(app);

app.set('trust proxy', 1);

// ─── Request ID ───────────────────────────────────────────────────────────────
app.use(requestId);

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(cors({
  origin:  [env.FRONTEND_URL, env.ADMIN_FRONTEND_URL || env.FRONTEND_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// ─── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());
app.use(mongoSanitize());

// ─── Logging ──────────────────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev', {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip:   (_req, res) => res.statusCode < 400 && env.NODE_ENV === 'production',
  }));
}

// ─── Rate limiting ─────────────────────────────────────────────────────────────
// Apply global rate limiting only in production to avoid blocking local development
if (env.NODE_ENV === 'production') {
  app.use('/api', generalLimiter);
} else {
  logger.info('Development mode: skipping global API rate limiter');
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Startup ──────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await initMonitoring();

    try {
      await connectDB();
    } catch {
      logger.error('Cannot connect to MongoDB. Check MONGODB_URI in your .env file.');
      process.exit(1);
    }

    try {
      await connectRedis();
    } catch {
      logger.warn('Redis unavailable — cache disabled. App will still work.');
    }

    http_server.listen(env.PORT, () => {
      logger.info(`FLOW API running on port ${env.PORT} [${env.NODE_ENV}]`);
      logger.info(`Health: http://localhost:${env.PORT}/api/v1/health`);
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM — shutting down');
      http_server.close(async () => {
        const { disconnectDB } = await import('./config/database');
        await disconnectDB();
        process.exit(0);
      });
    });
    process.on('SIGINT', () => {
      logger.info('SIGINT — shutting down');
      http_server.close(async () => {
        const { disconnectDB } = await import('./config/database');
        await disconnectDB();
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Startup failed', { error });
    process.exit(1);
  }
};

// Start the server unless we're running in the test environment. Tests
// will control the database connection themselves and import `app`
// directly to exercise routes without starting the HTTP listener.
if (env.NODE_ENV !== 'test') {
  start();
}

export default app;
