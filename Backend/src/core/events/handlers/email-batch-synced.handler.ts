import { LOGGER_MODULE } from '@constants';
import { EmailBatchSyncedPayload, SYSTEM_EVENT } from '@mailsense/types';
import { createLogger } from '@observability';
import { eventBus } from '../event-bus.js';

const logger = createLogger(LOGGER_MODULE.EMAIL_BATCH_SYNCED_HANDLER);

/**
 * Subscribes to EMAIL_BATCH_SYNCED system events emitted after successful email ingestion.
 * Acts as the entrypoint for downstream AI pipelines (categorization, summarization, priority scoring).
 */
export function registerEmailBatchSyncedHandler(): void {
    try {
        eventBus.subscribe(SYSTEM_EVENT.EMAIL_BATCH_SYNCED, async (payload: EmailBatchSyncedPayload) => {
            try {
                logger.info(`[EmailBatchSyncedHandler] Ingested email batch for account: ${payload.accountId}`, {
                    accountId: payload.accountId,
                    userId: payload.userId,
                    batchSize: payload.batchSize,
                    emailIdsCount: payload.emailIds.length,
                    timestamp: payload.timestamp,
                });

                // NOTE: Phase 4 (AI Foundation) will enqueue this batch into the BullMQ AI queue:
                // await QueueService.addAIBatchJob({
                //     accountId: payload.accountId,
                //     userId: payload.userId,
                //     emailIds: payload.emailIds,
                // });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                logger.error('[EmailBatchSyncedHandler] Failed to process email batch sync event', {
                    accountId: payload.accountId,
                    userId: payload.userId,
                    error: errorMessage,
                });
            }
        });
        logger.info('Registered EMAIL_BATCH_SYNCED subscriber successfully');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to register EMAIL_BATCH_SYNCED subscriber: ${errorMessage}`, { error });
        throw error;
    }
}
