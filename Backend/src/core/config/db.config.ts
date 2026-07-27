import mongoose from 'mongoose';

import { logger } from 'shared/utils/index.js';
import { DATABASE, MONGODB_URI } from './app.config.js';

export const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(MONGODB_URI, { dbName: DATABASE, maxPoolSize: 10 });
        logger.info('✅ MongoDB connected successfully');

        const db = mongoose.connection.db;
        if (db) {
            const collections = await db.listCollections({ name: 'accounts' }).toArray();
            if (collections.length > 0) {
                const accountsCollection = db.collection('accounts');
                const indexes = await accountsCollection.indexes();
                if (indexes.some((index) => index.name === 'id_1')) {
                    logger.info('🗑️ Dropping stale unique index "id_1" on accounts collection...');
                    await accountsCollection.dropIndex('id_1');
                    logger.info('✅ Stale index "id_1" dropped successfully');
                }
            }
        }
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
