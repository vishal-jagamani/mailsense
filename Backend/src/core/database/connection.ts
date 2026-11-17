import { DATABASE, MONGODB_URI } from '@config';
import { LOGGER_MODULE } from '@constants';
import { createLogger } from '@observability';
import { DatabaseConnectionOptions } from '@types';
import mongoose from 'mongoose';

const logger = createLogger(LOGGER_MODULE.SERVER);

const DEFAULT_CONNECTION_OPTIONS: mongoose.ConnectOptions = {
    dbName: DATABASE,
    maxPoolSize: 50,
    minPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

export class DatabaseConnectionManager {
    private static isConnected = false;
    private static areEventsRegistered = false;

    private static registerConnectionEvents(): void {
        if (this.areEventsRegistered) {
            return;
        }

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

        this.areEventsRegistered = true;
    }

    private static buildConnectionOptions(options?: DatabaseConnectionOptions): mongoose.ConnectOptions {
        if (!options) {
            return { ...DEFAULT_CONNECTION_OPTIONS };
        }

        return {
            dbName: options.dbName ?? DEFAULT_CONNECTION_OPTIONS.dbName,
            maxPoolSize: options.maxPoolSize ?? DEFAULT_CONNECTION_OPTIONS.maxPoolSize,
            minPoolSize: options.minPoolSize ?? DEFAULT_CONNECTION_OPTIONS.minPoolSize,
            serverSelectionTimeoutMS: options.serverSelectionTimeoutMS ?? DEFAULT_CONNECTION_OPTIONS.serverSelectionTimeoutMS,
            socketTimeoutMS: options.socketTimeoutMS ?? DEFAULT_CONNECTION_OPTIONS.socketTimeoutMS,
        };
    }

    public static async connect(options?: DatabaseConnectionOptions): Promise<void> {
        if (this.isConnected) {
            logger.info('Database connection already established');
            return;
        }

        const connectionOptions = this.buildConnectionOptions(options);
        this.registerConnectionEvents();

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

export type { DatabaseConnectionOptions };
