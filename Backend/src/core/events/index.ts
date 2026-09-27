import { logger } from '@utils';
import { registerEmailBatchSyncedHandler } from './handlers/email-batch-synced.handler.js';
import { registerEmailCreatedHandler } from './handlers/email-created.handler.js';
import { registerSyncCompletedHandler } from './handlers/sync-completed.handler.js';

export function initSystemEvents(): void {
    logger.info('🔔 Registering background system event handlers...');
    registerSyncCompletedHandler();
    registerEmailCreatedHandler();
    registerEmailBatchSyncedHandler();
    logger.info('🔔 System event handlers registered successfully');
}

export * from './event-bus.js';
