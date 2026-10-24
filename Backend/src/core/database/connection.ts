import { MONGODB_URI } from '@config';
import { LOGGER_MODULE } from '@constants';
import { createLogger } from '@observability';
import mongoose from 'mongoose';

const logger = createLogger(LOGGER_MODULE.SERVER);

export interface DatabaseConnectionOptions {
    readonly maxPoolSize?: number;
    readonly minPoolSize?: number;
    readonly serverSelectionTimeoutMS?: number;
    readonly socketTimeoutMS?: number;
}

export class DatabaseConnectionManager {
    private static isConnected = false;

    public static async connect(options?: DatabaseConnectionOptions): Promise<void> {
        if (this.isConnected) {
            logger.info('Database connection already established');
            return;
        }

        const connectionOptions: mongoose.ConnectOptions = {
            maxPoolSize: options?.maxPoolSize || 50,
            minPoolSize: options?.minPoolSize || 10,
            serverSelectionTimeoutMS: options?.serverSelectionTimeoutMS || 5000,
            socketTimeoutMS: options?.socketTimeoutMS || 45000,
        };

        mongoose.connection.on('connected', () => {
            logger.info('MongoDB connection established successfully');
        });

        mongoose.connection.on('error', (err: Error) => {
            logger.error('MongoDB connection runtime error', { error: err });
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected. Reconnecting...');
            this.isConnected = false;
        });

        try {
            await mongoose.connect(MONGODB_URI, connectionOptions);
            this.isConnected = true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Initial MongoDB connection failed: ${errorMessage}`, { error });
            throw error;
        }
    }

    public static async disconnect(): Promise<void> {
        if (!this.isConnected) return;
        try {
            await mongoose.disconnect();
            this.isConnected = false;
            logger.info('MongoDB disconnected gracefully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Error during MongoDB disconnection: ${errorMessage}`, { error });
            throw error;
        }
    }

    public static getConnectionStatus(): boolean {
        return this.isConnected && mongoose.connection.readyState === 1;
    }
}
