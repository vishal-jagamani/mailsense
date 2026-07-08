import { connectDB, PORT } from '@config';
import { App } from './app.js';
import './instruction.mjs';
import { logger } from './shared/utils/logger.js';
import { initBackgroundJobs, shutdownBackgroundJobs } from './core/queue/index.js';

// Create app instance
const appInstance = new App();
const app = appInstance.expressApp;

const startServer = async () => {
    try {
        // Connect MongoDB (with pooling)
        await connectDB();

        // Initialize Background Queues
        initBackgroundJobs();

        // Start Express only after DB is ready
        const server = app.listen(PORT, () => {
            logger.info(`🚀 MailSense Backend is running on port ${PORT}`);
        });

        // Graceful shutdown helper
        const gracefulShutdown = async (signal: string) => {
            logger.info(`Received ${signal}. Starting graceful shutdown...`);

            // Close background jobs & Redis connections
            await shutdownBackgroundJobs();

            // Close server HTTP connections
            server.close(() => {
                logger.info('HTTP server closed.');
                process.exit(0);
            });

            // Force close if server takes too long to shut down
            setTimeout(() => {
                logger.warn('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };

        // Capture termination signals
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`❌ Failed to start server: ${errorMessage}`, { error });
        process.exit(1);
    }
};

// Start server
startServer();
