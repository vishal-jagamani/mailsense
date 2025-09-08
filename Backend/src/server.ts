import { App } from './app.js';
import { PORT } from './config/config.js';

// Create app instance
const appInstance = new App();
const app = appInstance.expressApp;

// Start server
app.listen(PORT, () => {
    console.log(`MailSense Backend is running on port ${PORT}`);
});
