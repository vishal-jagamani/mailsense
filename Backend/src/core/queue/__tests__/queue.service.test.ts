import { QUEUE_NAMES } from '../queue.config.js';
import { closeAllQueues, getQueue, initQueueRegistry } from '../queue.registry.js';
import { QueueService } from '../queue.service.js';
import { closeRedisConnection } from '../redis.connection.js';

describe('QueueService Integration Test', () => {
    beforeAll(() => {
        initQueueRegistry();
    });

    afterAll(async () => {
        await closeAllQueues();
        await closeRedisConnection();
    });

    it('should successfully add a sync job to the sync-account queue', async () => {
        const payload = {
            accountId: 'test-account-123',
            userId: 'test-user-456',
            force: true,
        };

        const jobId = await QueueService.addSyncAccountJob(payload, 1);
        expect(jobId).toBeDefined();

        const queue = getQueue(QUEUE_NAMES.SYNC_ACCOUNT);
        const job = await queue.getJob(jobId!);

        expect(job).toBeDefined();
        expect(job?.name).toBe('sync:test-account-123');
        expect(job?.data).toEqual(payload);

        // Clean up the job
        if (job) {
            await job.remove();
        }
    });
});
