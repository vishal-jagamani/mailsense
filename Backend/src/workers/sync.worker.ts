import { ACCOUNT_LAST_SYNC_STATUS, ACCOUNT_SYNC_JOB_STATUS, ACCOUNT_SYNC_JOB_TRIGGER_TYPE, SyncJobResult, SYSTEM_EVENT } from '@mailsense/types';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { SyncJobRepository } from '@modules/accounts/sync-job.repository.js';
import { logger } from '@utils';
import { Job } from 'bullmq';
import { eventBus } from 'core/events/event-bus.js';
import { QUEUE_NAMES } from 'core/queue/queue.config.js';
import { SyncAccountPayload } from 'core/queue/queue.service.js';
import { BaseWorker } from './base.worker.js';
import { syncAccountProcessor } from './processors/sync-account.processor.js';

export class SyncWorker extends BaseWorker<SyncAccountPayload, SyncJobResult> {
    protected queueName = QUEUE_NAMES.SYNC_ACCOUNT;

    protected async processJob(job: Job<SyncAccountPayload, SyncJobResult>): Promise<SyncJobResult> {
        return syncAccountProcessor(job);
    }

    protected async onActive(job: Job<SyncAccountPayload, SyncJobResult>): Promise<void> {
        try {
            const { accountId } = job.data;
            if (job.id) {
                const existingJob = await SyncJobRepository.getSyncJobByBullId(job.id);
                if (!existingJob) {
                    await SyncJobRepository.createSyncJob({
                        accountId: accountId,
                        bullJobId: job.id,
                        status: ACCOUNT_SYNC_JOB_STATUS.RUNNING,
                        triggerType: ACCOUNT_SYNC_JOB_TRIGGER_TYPE.SCHEDULED,
                        startedAt: Date.now(),
                    });
                } else {
                    await SyncJobRepository.updateSyncJob(job.id, {
                        status: ACCOUNT_SYNC_JOB_STATUS.RUNNING,
                        startedAt: Date.now(),
                    });
                }
            }
            await AccountRepository.updateAccount(accountId, {
                syncInProgress: true,
                lastSyncStatus: ACCOUNT_LAST_SYNC_STATUS.PENDING,
                lastSyncStartedAt: Date.now(),
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`Error in SyncWorker.onActive: ${msg}`, { error });
        }
    }

    protected async onCompleted(job: Job<SyncAccountPayload, SyncJobResult>, result: SyncJobResult): Promise<void> {
        try {
            const { accountId } = job.data;
            if (job.id) {
                await SyncJobRepository.updateSyncJob(job.id, {
                    status: ACCOUNT_SYNC_JOB_STATUS.COMPLETED,
                    completedAt: Date.now(),
                    addedEmailsCount: result?.addedEmailsCount || 0,
                    deletedEmailsCount: result?.deletedEmailsCount || 0,
                });
            }
            await AccountRepository.updateAccount(accountId, {
                syncInProgress: false,
                lastSyncStatus: ACCOUNT_LAST_SYNC_STATUS.SUCCESS,
                lastSyncCompletedAt: Date.now(),
            });

            // Emit SYNC_COMPLETED event on background sync success
            eventBus.publish(SYSTEM_EVENT.SYNC_COMPLETED, {
                accountId,
                addedEmailsCount: result?.addedEmailsCount || 0,
                deletedEmailsCount: result?.deletedEmailsCount || 0,
                startedAt: job.processedOn || Date.now(),
                completedAt: Date.now(),
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`Error in SyncWorker.onCompleted: ${msg}`, { error });
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
            logger.error(`Error in SyncWorker.onFailed: ${msg}`, { error: err });
        }
    }
}
