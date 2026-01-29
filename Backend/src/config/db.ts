import mongoose from 'mongoose';
import { logger } from '@utils/logger.js';
import { DATABASE, MONGODB_URI } from './config.js';

export const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(MONGODB_URI, { dbName: DATABASE, maxPoolSize: 10 });
        logger.info('✅ MongoDB connected successfully');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error(`❌ MongoDB connection failed: ${errorMessage}`, { error: err });
        process.exit(1);
    }
};

export const disconnectDB = async (): Promise<void> => {
    await mongoose.disconnect();
    logger.info('🔌 MongoDB disconnected');
};
