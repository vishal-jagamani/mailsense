import { LOGGER_MODULE } from '@constants';
import { ACCOUNT_LAST_SYNC_STATUS, ACCOUNT_SYNC_JOB_STATUS, ACCOUNT_SYNC_JOB_TRIGGER_TYPE, SyncJobResult, SYSTEM_EVENT } from '@mailsense/types';
import { AccountRepository, SyncJobRepository } from '@modules/accounts/database/index.js';
import { createLogger } from '@observability';
import { SyncAccountPayload } from '@types';
import { Job } from 'bullmq';
import { eventBus } from 'core/events/event-bus.js';
import { QUEUE_NAMES } from 'core/queue/queue.config.js';
import { BaseWorker } from '../base.worker.js';
import { syncAccountProcessor } from '../processors/sync-account.processor.js';

export class SyncWorker extends BaseWorker<SyncAccountPayload, SyncJobResult> {
    protected queueName = QUEUE_NAMES.SYNC_ACCOUNT;
    protected override workerLogger = createLogger(LOGGER_MODULE.SYNC_WORKER);

    protected async processJob(job: Job<SyncAccountPayload, SyncJobResult>): Promise<SyncJobResult> {
        return syncAccountProcessor(job);
    }

    protected async onActive(job: Job<SyncAccountPayload, SyncJobResult>): Promise<void> {
        try {
            const { accountId, triggerType } = job.data;
            if (job.id) {
                await SyncJobRepository.upsertSyncJob(job.id, {
                    accountId,
                    bullJobId: job.id,
                    status: ACCOUNT_SYNC_JOB_STATUS.RUNNING,
                    triggerType: triggerType ?? ACCOUNT_SYNC_JOB_TRIGGER_TYPE.SCHEDULED,
                    startedAt: Date.now(),
                });
            }
            await AccountRepository.updateAccount(accountId, {
                syncInProgress: true,
                lastSyncStatus: ACCOUNT_LAST_SYNC_STATUS.PENDING,
                lastSyncStartedAt: Date.now(),
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.workerLogger.error(`Error in SyncWorker.onActive: ${msg}`, { error });
        }
    }

    private async recordSyncJobSuccess(
        jobId: string | undefined,
        addedEmailsCount: number,
        deletedEmailsCount: number,
        completedAt: number,
    ): Promise<void> {
        if (!jobId) return;
        await SyncJobRepository.updateSyncJob(jobId, {
            status: ACCOUNT_SYNC_JOB_STATUS.COMPLETED,
            completedAt,
            addedEmailsCount,
            deletedEmailsCount,
        });
    }

    protected async onCompleted(job: Job<SyncAccountPayload, SyncJobResult>, result: SyncJobResult): Promise<void> {
        try {
            const { accountId } = job.data;
            const addedEmailsCount = result?.addedEmailsCount ?? 0;
            const deletedEmailsCount = result?.deletedEmailsCount ?? 0;
            const completedAt = Date.now();

            await this.recordSyncJobSuccess(job.id, addedEmailsCount, deletedEmailsCount, completedAt);

            await AccountRepository.updateAccount(accountId, {
                syncInProgress: false,
                lastSyncStatus: ACCOUNT_LAST_SYNC_STATUS.SUCCESS,
                lastSyncCompletedAt: completedAt,
            });

            // Emit SYNC_COMPLETED event on background sync success
            eventBus.publish(SYSTEM_EVENT.SYNC_COMPLETED, {
                accountId,
                addedEmailsCount,
                deletedEmailsCount,
                startedAt: job.processedOn ?? completedAt,
                completedAt,
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.workerLogger.error(`Error in SyncWorker.onCompleted: ${msg}`, { error });
        }
    }

    protected async onFailed(job: Job<SyncAccountPayload, SyncJobResult> | undefined, error: Error): Promise<void> {
        try {
            if (!job) return;
            const { accountId } = job.data;
            if (job.id) {
                await SyncJobRepository.updateSyncJob(job.id, {
                    status: ACCOUNT_SYNC_JOB_STATUS.FAILED,
                    completedAt: Date.now(),
                    errorMessage: error.message,
                    errorStack: error.stack,
                });
            }
            await AccountRepository.updateAccount(accountId, {
                syncInProgress: false,
                lastSyncStatus: ACCOUNT_LAST_SYNC_STATUS.FAILED,
                lastSyncError: error.message,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.workerLogger.error(`Error in SyncWorker.onFailed: ${msg}`, { error: err });
        }
    }
}
