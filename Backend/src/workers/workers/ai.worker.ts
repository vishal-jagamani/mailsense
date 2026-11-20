import { LOGGER_MODULE } from '@constants';
import { AIProcessingJobPayload, AIProcessingJobResult } from '@mailsense/types';
import { createLogger } from '@observability';
import { QUEUE_NAMES } from '@queue';
import { Job, WorkerOptions } from 'bullmq';
import { BaseWorker } from '../base.worker.js';
import { aiProcessingProcessor } from '../processors/ai-processing.processor.js';

export class AIProcessingWorker extends BaseWorker<AIProcessingJobPayload, AIProcessingJobResult> {
    protected queueName = QUEUE_NAMES.AI_PROCESSING;
    protected override workerLogger = createLogger(LOGGER_MODULE.AI_WORKER);

    protected override getWorkerOptions(): Partial<WorkerOptions> {
        return {
            concurrency: 5, // 5 concurrent LLM network requests
            lockDuration: 60000, // 60s lock for long-running AI operations
            limiter: {
                max: 50, // 50 requests per minute to match Gemini API rate limits
                duration: 60000,
            },
        };
    }

    protected async processJob(job: Job<AIProcessingJobPayload, AIProcessingJobResult>): Promise<AIProcessingJobResult> {
        return aiProcessingProcessor(job);
    }
}
