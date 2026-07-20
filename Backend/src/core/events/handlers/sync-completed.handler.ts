import { logger } from '@utils';
import { eventBus } from '../event-bus.js';
import { SyncCompletedPayload, SystemEvent } from '../event.types.js';

export function registerSyncCompletedHandler(): void {
    eventBus.subscribe(SystemEvent.SYNC_COMPLETED, async (payload: SyncCompletedPayload) => {
        logger.info(`[Stub Subscriber] Sync Completed for account: ${payload.accountId}`, {
            addedCount: payload.addedEmailsCount,
            deletedCount: payload.deletedEmailsCount,
            durationMs: payload.completedAt - payload.startedAt,
        });

        // NOTE: Future dashboard analytics, metrics updates or reporting jobs will be enqueued here.
        // For example:
        // await QueueService.addDashboardJob({ accountId: payload.accountId });
    });
}
