import { SyncCompletedPayload, SYSTEM_EVENT } from '@mailsense/types';
import { AnalyticsService } from '@modules/analytics/analytics.service.js';
import { logger } from '@utils';
import { eventBus } from '../event-bus.js';

export function registerSyncCompletedHandler(): void {
    const analyticsService = new AnalyticsService();

    eventBus.subscribe(SYSTEM_EVENT.SYNC_COMPLETED, async (payload: SyncCompletedPayload) => {
        try {
            logger.info(`[Stub Subscriber] Sync Completed for account: ${payload.accountId}`, {
                addedCount: payload.addedEmailsCount,
                deletedCount: payload.deletedEmailsCount,
                durationMs: payload.completedAt - payload.startedAt,
            });

            // NOTE: Future dashboard analytics, metrics updates or reporting jobs will be enqueued here.
            // For example:
            // await QueueService.addDashboardJob({ accountId: payload.accountId });
            
            // Automatically refresh account metrics daily snapshot
            await analyticsService.refreshAccountMetrics(payload.accountId);
        } catch (err) {
            logger.error('[SyncCompleted Handler] Failed to process sync completed metrics update', {
                accountId: payload.accountId,
                err,
            });
        }
    });
}
