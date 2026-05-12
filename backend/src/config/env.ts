import { z } from 'zod';

// ─── Schema ───────────────────────────────────────────────────────────────────
const envSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),

  // Database — Atlas or local
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_TEST_URI: z.string().optional(),

  // Redis — optional, app works without it (cache is disabled)
  REDIS_ENABLED: z.coerce.boolean().default(false),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),

  // JWT — must be 32+ chars
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Frontend URL
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  ADMIN_FRONTEND_URL: z.string().optional(),

  // Cloudinary — required for image uploads
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),

  // Email — required for account verification
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  EMAIL_FROM: z.string().default('noreply@store.com'),
  EMAIL_FROM_NAME: z.string().default('Store'),

  // AI — optional
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_CHAT_MODEL: z.string().default('openai/gpt-4o-mini'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().default(100),

  // Bcrypt
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(14).default(12),

  // Logging
  LOG_DIR: z.string().default('logs'),
  LOG_LEVEL: z.string().default('info'),

  // Sentry — fully optional, empty string is fine
  SENTRY_DSN: z.string().optional(),

  // Admin seed
  ADMIN_EMAIL: z.string().default('admin@store.com'),
  ADMIN_PASSWORD: z.string().min(8).default('Admin@123456'),
  ADMIN_FIRST_NAME: z.string().default('Store'),
  ADMIN_LAST_NAME: z.string().default('Admin'),
});

function validateEnv() {
  // When running tests, provide sensible defaults for required env vars so
  // integration tests can run in CI/local environments without a full env.
  if (process.env.NODE_ENV === 'test') {
    process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace_test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_which_is_long_enough_123456';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_jwt_refresh_secret_which_is_long_enough_123456';
    process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'test';
    process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'test';
    process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'test';
    process.env.SMTP_HOST = process.env.SMTP_HOST || 'localhost';
    process.env.SMTP_USER = process.env.SMTP_USER || 'test';
    process.env.SMTP_PASS = process.env.SMTP_PASS || 'test';
  }
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    process.stderr.write(
      `\n[Config] Environment validation failed. Fix the following before starting:\n${issues}\n\n`
    );
    process.exit(1);
  }

  return parsed.data;
}

export const env = validateEnv();
export type Env = z.infer<typeof envSchema>;
