import { logger } from '@utils';
import { ConnectionOptions, Job, Worker, WorkerOptions } from 'bullmq';
import { getRedisConnection } from 'core/queue/redis.connection.js';

export abstract class BaseWorker<TData, TResult> {
    protected worker!: Worker<TData, TResult>;
    protected abstract queueName: string;
    protected abstract processJob(job: Job<TData, TResult>): Promise<TResult>;

    public start(): void {
        const connection = getRedisConnection();
        const prefix = process.env.NODE_ENV === 'test' ? 'bull-test' : process.env.BULL_PREFIX || 'bull';

        const workerOptions: WorkerOptions = {
            connection: connection as ConnectionOptions,
            concurrency: 2, // Safe concurrency limit for low memory container (256MB RAM)
            prefix,
        };

        this.worker = new Worker<TData, TResult>(
            this.queueName,
            async (job) => {
                logger.info(`🚀 Starting job ${job.id} [${job.name}] on queue ${this.queueName}`);
                try {
                    return await this.processJob(job);
                } catch (error) {
                    const msg = error instanceof Error ? error.message : String(error);
                    logger.error(`❌ Job ${job.id} failed in processor: ${msg}`, { error, jobId: job.id });
                    throw error;
                }
            },
            workerOptions,
        );

        this.worker.on('active', (job) => {
            logger.info(`🏃 Job ${job.id} is now active`);
            this.onActive(job);
        });

        this.worker.on('completed', (job, result) => {
            logger.info(`✅ Job ${job.id} completed successfully`);
            this.onCompleted(job, result);
        });

        this.worker.on('failed', (job, error) => {
            logger.error(`❌ Job ${job?.id} failed with error: ${error.message}`, { error });
            this.onFailed(job, error);
        });

        logger.info(`👷 Worker started for queue: ${this.queueName}`);
    }

    public async shutdown(): Promise<void> {
        if (this.worker) {
            await this.worker.close();
            logger.info(`✅ Worker for queue ${this.queueName} closed`);
        }
    }

    protected abstract onActive(job: Job<TData, TResult>): void | Promise<void>;
    protected abstract onCompleted(job: Job<TData, TResult>, result: TResult): void | Promise<void>;
    protected abstract onFailed(job: Job<TData, TResult> | undefined, error: Error): void | Promise<void>;
}
