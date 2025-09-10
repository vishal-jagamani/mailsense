import mongoose from 'mongoose';
import { MONGODB_URI } from './config.js';
import { logger } from '../utils/logger.js';

export const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, { maxPoolSize: 10 });
        logger.info('✅ MongoDB connected successfully');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error(`❌ MongoDB connection failed: ${errorMessage}`, { error: err });
        process.exit(1);
    }
};

export async function disconnectDB() {
    await mongoose.disconnect();
    logger.info('🔌 MongoDB disconnected');
}
