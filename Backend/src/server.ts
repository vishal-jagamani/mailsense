import { App } from './app.js';
import { PORT } from './config/config.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import './instruction.mjs';

// Create app instance
const appInstance = new App();
const app = appInstance.expressApp;

const startServer = async () => {
    try {
        // Connect MongoDB (with pooling)
        await connectDB();
        // Start Express only after DB is ready
        app.listen(PORT, () => {
            logger.info(`🚀 MailSense Backend is running on port ${PORT}`);
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`❌ Failed to start server: ${errorMessage}`, { error });
        process.exit(1);
    }
};

// Start server
startServer();
