import { LOGGER_MODULE } from '@constants';
import { monitoring } from '@monitoring';
import { createLogger, runWithTrace } from '@observability';
import { getRedisConnection } from '@queue';
import { ConnectionOptions, Job, Worker, WorkerOptions } from 'bullmq';
import crypto from 'node:crypto';

export abstract class BaseWorker<TData, TResult> {
    protected worker!: Worker<TData, TResult>;
    protected abstract queueName: string;
    protected abstract processJob(job: Job<TData, TResult>): Promise<TResult>;
    protected workerLogger = createLogger(LOGGER_MODULE.BASE_WORKER);

    public start(): void {
        const connection = getRedisConnection();
        const prefix = process.env.NODE_ENV === 'test' ? 'bull-test' : process.env.BULL_PREFIX || 'bull';

        const workerOptions: WorkerOptions = {
            connection: connection as ConnectionOptions,
            concurrency: 2,
            prefix,
            lockDuration: 300000,
        };

        this.worker = new Worker<TData, TResult>(
            this.queueName,
            async (job) => {
                // Extract traceId, userId, and accountId from job payload if available
                const jobData = job.data as Record<string, unknown> | undefined;
                const traceId = typeof jobData?.traceId === 'string' && jobData.traceId.length > 0 ? jobData.traceId : crypto.randomUUID();
                const userId = typeof jobData?.userId === 'string' && jobData.userId.length > 0 ? jobData.userId : undefined;
                const userEmail = typeof jobData?.userEmail === 'string' && jobData.userEmail.length > 0 ? jobData.userEmail : undefined;
                const userName = typeof jobData?.userName === 'string' && jobData.userName.length > 0 ? jobData.userName : undefined;
                const accountId = typeof jobData?.accountId === 'string' && jobData.accountId.length > 0 ? jobData.accountId : undefined;

                return await runWithTrace({ traceId, userId, userEmail, userName, accountId }, async () => {
                    if (userId) {
                        monitoring.setUser({ id: userId, email: userEmail, username: userName });
                    }
                    this.workerLogger.info(`🚀 Starting job ${job.id} [${job.name}] on queue ${this.queueName}`, {
                        jobId: job.id,
                        queueName: this.queueName,
                        jobName: job.name,
                    });
                    try {
                        return await this.processJob(job);
                    } catch (error) {
                        const err = error instanceof Error ? error : new Error(String(error));
                        this.workerLogger.error(`❌ Job ${job.id} failed in processor: ${err.message}`, {
                            error: err,
                            jobId: job.id,
                            queueName: this.queueName,
                        });

                        // Report background worker failure to active APM provider
                        monitoring.reportWorkerError(err, {
                            queueName: this.queueName,
                            jobId: String(job.id),
                            jobName: job.name,
                            traceId,
                        });

                        throw err;
                    }
                });
            },
            workerOptions,
        );

        this.worker.on('active', (job) => {
            this.workerLogger.info(`🏃 Job ${job.id} is now active`, { jobId: job.id, queueName: this.queueName });
            this.onActive(job);
        });

        this.worker.on('completed', (job, result) => {
            this.workerLogger.info(`✅ Job ${job.id} completed successfully`, { jobId: job.id, queueName: this.queueName });
            this.onCompleted(job, result);
        });

        this.worker.on('failed', (job, err) => {
            this.workerLogger.error(`💥 Job ${job?.id} failed with error: ${err.message}`, {
                error: err,
                jobId: job?.id,
                queueName: this.queueName,
            });
            this.onFailed(job, err);
        });
    }

    protected async onActive(_job: Job<TData, TResult>): Promise<void> {}
    protected async onCompleted(_job: Job<TData, TResult>, _result: TResult): Promise<void> {}
    protected async onFailed(_job: Job<TData, TResult> | undefined, _error: Error): Promise<void> {}

    public async close(): Promise<void> {
        try {
            if (this.worker) {
                await this.worker.close();
                this.workerLogger.info(`🔒 Worker for queue ${this.queueName} closed`);
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.workerLogger.error(`Error closing worker for queue ${this.queueName}: ${msg}`, { error });
        }
    }

    public async shutdown(): Promise<void> {
        await this.close();
    }
}
