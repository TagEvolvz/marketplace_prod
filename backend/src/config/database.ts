import mongoose from 'mongoose';
import logger from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI!;

  mongoose.set('strictQuery', false);

  try {
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,  // 10 s — Atlas needs longer than local
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });

    const host = mongoose.connection.host;
    logger.info(`MongoDB connected: ${host}`);

    mongoose.connection.on('disconnected', () =>
      logger.warn('MongoDB disconnected — attempting reconnect...')
    );
    mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
    mongoose.connection.on('error', (err) => logger.error('MongoDB error', { message: err.message }));
  } catch (error) {
    const err = error as Error & { code?: string };
    logger.error(`MongoDB connection failed for ${mongoUri.includes('mongodb.net') ? mongoose.connection.host || 'Atlas' : 'localhost'}: ${err.message}`);

    if (mongoUri.includes('mongodb.net')) {
      logger.error('Atlas connection check: confirm your Atlas username/password, Network Access IP allowlist, and internet/DNS access.');
    }

    // Do NOT exit — let the caller decide (allows graceful shutdown)
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};
