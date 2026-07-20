import { logger } from '@utils';
import { registerEmailCreatedHandler } from './handlers/email-created.handler.js';
import { registerSyncCompletedHandler } from './handlers/sync-completed.handler.js';

export function initSystemEvents(): void {
    logger.info('🔔 Registering background system event handlers...');
    registerSyncCompletedHandler();
    registerEmailCreatedHandler();
    logger.info('🔔 System event handlers registered successfully');
}

export * from './event-bus.js';
export * from './event.types.js';
