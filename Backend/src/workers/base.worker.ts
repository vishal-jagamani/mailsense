import { LOGGER_MODULE } from '@constants';
import { monitoring } from '@monitoring';
import { createLogger, runWithTrace } from '@observability';
import { getRedisConnection } from '@queue';
import { TraceStore } from '@types';
import { ConnectionOptions, Job, Worker, WorkerOptions } from 'bullmq';
import crypto from 'node:crypto';

export abstract class BaseWorker<TData, TResult> {
    protected worker!: Worker<TData, TResult>;
    protected abstract queueName: string;
    protected abstract processJob(job: Job<TData, TResult>): Promise<TResult>;
    protected workerLogger = createLogger(LOGGER_MODULE.BASE_WORKER);

    protected getWorkerOptions(): Partial<WorkerOptions> {
        return {};
    }

    public start(): void {
        const connection = getRedisConnection();
        const prefix = process.env.NODE_ENV === 'test' ? 'bull-test' : process.env.BULL_PREFIX || 'bull';

        const workerOptions: WorkerOptions = {
            connection: connection as ConnectionOptions,
            concurrency: 2,
            prefix,
            lockDuration: 300000,
            ...this.getWorkerOptions(),
        };

        this.worker = new Worker<TData, TResult>(
            this.queueName,
            async (job) => {
                return await this.runWithTraceContext(job, this.extractTraceContext(job));
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

    private extractTraceContext(job: Job): TraceStore {
        const jobData = job.data as Record<string, string | number | boolean | object> | undefined;
        const traceId = this.extractJobString(jobData, 'traceId') || crypto.randomUUID();
        const userId = this.extractJobString(jobData, 'userId');
        const userEmail = this.extractJobString(jobData, 'userEmail');
        const userName = this.extractJobString(jobData, 'userName');
        const accountId = this.extractJobString(jobData, 'accountId');
        return { traceId, userId, userEmail, userName, accountId };
    }

    private extractJobString(data: Record<string, string | number | boolean | object> | undefined, key: string): string | undefined {
        if (!data) return undefined;
        const value = data[key];
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed.length > 0) return trimmed;
        }
        return undefined;
    }

    private async runWithTraceContext(job: Job, traceContext: TraceStore) {
        const { traceId, userId, userEmail, userName, accountId } = traceContext;
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
