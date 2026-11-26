import { AI_CONFIG } from '@config';
import { LOGGER_MODULE } from '@constants';
import {
    AI_JOB_STATUS,
    AI_OPERATION_TYPE,
    AI_PROCESSING_STATUS,
    AI_PROVIDER_NAME,
    AIProcessingJobPayload,
    AIProcessingJobResult,
} from '@mailsense/types';
import { AiJobRepository } from '@modules/ai/database/index.js';
import { createLogger, getTraceId } from '@observability';
import { QUEUE_NAMES } from '@queue';
import { Job, WorkerOptions } from 'bullmq';
import { BaseWorker } from '../base.worker.js';
import { aiProcessingProcessor } from '../processors/ai-processing.processor.js';

const STATUS_MAP: Record<AI_PROCESSING_STATUS, AI_JOB_STATUS> = {
    [AI_PROCESSING_STATUS.SUCCESS]: AI_JOB_STATUS.COMPLETED,
    [AI_PROCESSING_STATUS.SKIPPED]: AI_JOB_STATUS.SKIPPED,
    [AI_PROCESSING_STATUS.RATE_LIMITED]: AI_JOB_STATUS.RATE_LIMITED,
    [AI_PROCESSING_STATUS.FAILED]: AI_JOB_STATUS.FAILED,
};

export class AIProcessingWorker extends BaseWorker<AIProcessingJobPayload, AIProcessingJobResult> {
    protected queueName = QUEUE_NAMES.AI_PROCESSING;
    protected override workerLogger = createLogger(LOGGER_MODULE.AI_WORKER);

    protected override getWorkerOptions(): Partial<WorkerOptions> {
        return {
            concurrency: 5,
            lockDuration: 60000,
            limiter: {
                max: 50,
                duration: 60000,
            },
        };
    }

    protected async processJob(job: Job<AIProcessingJobPayload, AIProcessingJobResult>): Promise<AIProcessingJobResult> {
        return aiProcessingProcessor(job);
    }

    protected override async onActive(job: Job<AIProcessingJobPayload, AIProcessingJobResult>): Promise<void> {
        try {
            if (!job.id) return;
            const { userId, accountId, emailId, forceReprocess } = job.data;
            const operationType = forceReprocess ? AI_OPERATION_TYPE.MANUAL_REPROCESS : AI_OPERATION_TYPE.BACKGROUND_CLASSIFICATION;

            await AiJobRepository.upsertBackgroundJob(job.id, {
                userId,
                accountId,
                emailId,
                bullJobId: job.id,
                operationType,
                status: AI_JOB_STATUS.RUNNING,
                provider: AI_CONFIG.provider as AI_PROVIDER_NAME,
                modelName: AI_CONFIG.geminiModel,
                startedAt: Date.now(),
                attemptCount: (job.attemptsMade ?? 0) + 1,
                traceId: getTraceId() || undefined,
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.workerLogger.error(`Error persisting AI job start state in AIProcessingWorker.onActive: ${msg}`, { error });
        }
    }

    protected override async onCompleted(job: Job<AIProcessingJobPayload, AIProcessingJobResult>, result: AIProcessingJobResult): Promise<void> {
        try {
            if (!job.id) return;
            const completedAt = Date.now();
            const jobStatus = STATUS_MAP[result.status] ?? AI_JOB_STATUS.COMPLETED;

            await AiJobRepository.updateBackgroundJob(job.id, {
                status: jobStatus,
                completedAt,
                processingDurationMs: result.processingDurationMs,
                tokenUsage: result.tokenUsage,
                modelName: result.modelName ?? AI_CONFIG.geminiModel,
                skippedReason: result.skippedReason,
                errorMessage: jobStatus === AI_JOB_STATUS.FAILED ? result.skippedReason : undefined,
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.workerLogger.error(`Error updating AI job completion in AIProcessingWorker.onCompleted: ${msg}`, { error });
        }
    }

    protected override async onFailed(job: Job<AIProcessingJobPayload, AIProcessingJobResult> | undefined, error: Error): Promise<void> {
        try {
            if (!job?.id) return;
            const completedAt = Date.now();
            const startedAt = job.processedOn ?? completedAt;

            await AiJobRepository.updateBackgroundJob(job.id, {
                status: AI_JOB_STATUS.FAILED,
                completedAt,
                processingDurationMs: Math.max(0, completedAt - startedAt),
                errorMessage: error.message,
                errorCode: error.name || 'AI_WORKER_FAILED',
                attemptCount: (job.attemptsMade ?? 0) + 1,
            });
        } catch (persistError) {
            const msg = persistError instanceof Error ? persistError.message : String(persistError);
            this.workerLogger.error(`Error updating AI job failure in AIProcessingWorker.onFailed: ${msg}`, { error: persistError });
        }
    }
}
