import { AccountRepository } from '@modules/accounts/account.repository.js';
import { UserSettingsRepository } from '@modules/user/user-settings.repository.js';
import { getQueue } from '../queue.registry.js';
import { SchedulerService } from '../scheduler.service.js';

jest.mock('@modules/accounts/account.repository.js');
jest.mock('@modules/user/user-settings.repository.js');
jest.mock('../queue.registry.js');

interface MockQueue {
    getJobSchedulers: jest.Mock;
    removeJobScheduler: jest.Mock;
    add: jest.Mock;
}

describe('SchedulerService', () => {
    let mockQueue: MockQueue;

    beforeEach(() => {
        mockQueue = {
            getJobSchedulers: jest.fn(),
            removeJobScheduler: jest.fn(),
            add: jest.fn(),
        };
        (getQueue as jest.Mock).mockReturnValue(mockQueue);
        (UserSettingsRepository.getUserSettings as jest.Mock).mockResolvedValue(null);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('init', () => {
        it('should sync repeatable jobs with DB accounts, removing obsolete ones', async () => {
            const mockSchedulers = [
                { key: 'key1', name: 'sync:acc1', every: 3600000 }, // Matches active acc1
                { key: 'key2', name: 'sync:acc2', every: 1800000 }, // Deprecated acc (not in DB list)
                { key: 'key3', name: 'sync:acc3', every: 60000 }, // Match but interval changed (every is 60000 but expected is 300000)
            ];

            const mockAccounts = [
                { _id: 'acc1', userId: 'user1', syncInterval: 60, active: true, syncEnabled: true }, // every = 3600000
                { _id: 'acc3', userId: 'user3', syncInterval: 5, active: true, syncEnabled: true }, // every = 300000
                { _id: 'acc4', userId: 'user4', syncInterval: 10, active: true, syncEnabled: true }, // Not registered yet
            ];

            mockQueue.getJobSchedulers.mockResolvedValue(mockSchedulers);
            (AccountRepository.getAccounts as jest.Mock).mockResolvedValue(mockAccounts);
            (AccountRepository.getAccountById as jest.Mock).mockImplementation((id: string) =>
                Promise.resolve(mockAccounts.find((a) => a._id === id)),
            );

            await SchedulerService.init();

            // Should remove acc3 (interval shift)
            expect(mockQueue.removeJobScheduler).toHaveBeenCalledWith('key3');

            // Should add repeatable sync for acc3 and acc4
            expect(mockQueue.add).toHaveBeenCalledWith(
                'sync:acc3',
                { accountId: 'acc3', userId: 'user3', force: false },
                {
                    repeat: { every: 300000 },
                    jobId: 'repeat:acc3',
                    priority: 2,
                },
            );
            expect(mockQueue.add).toHaveBeenCalledWith(
                'sync:acc4',
                { accountId: 'acc4', userId: 'user4', force: false },
                {
                    repeat: { every: 600000 },
                    jobId: 'repeat:acc4',
                    priority: 2,
                },
            );
        });
    });

    describe('upsertAccountRepeatableJob', () => {
        it('should register a repeatable job for active, enabled account', async () => {
            const mockAccount = { _id: 'acc1', userId: 'user1', syncInterval: 15, active: true, syncEnabled: true };
            (AccountRepository.getAccountById as jest.Mock).mockResolvedValue(mockAccount);
            mockQueue.getJobSchedulers.mockResolvedValue([]);

            await SchedulerService.upsertAccountRepeatableJob('acc1');

            expect(mockQueue.add).toHaveBeenCalledWith(
                'sync:acc1',
                { accountId: 'acc1', userId: 'user1', force: false },
                {
                    repeat: { every: 900000 },
                    jobId: 'repeat:acc1',
                    priority: 2,
                },
            );
        });

        it('should remove repeatable job and abort if account is inactive', async () => {
            const mockAccount = { _id: 'acc1', userId: 'user1', syncInterval: 15, active: false, syncEnabled: true };
            (AccountRepository.getAccountById as jest.Mock).mockResolvedValue(mockAccount);
            mockQueue.getJobSchedulers.mockResolvedValue([{ key: 'key1', name: 'sync:acc1', every: 900000 }]);

            await SchedulerService.upsertAccountRepeatableJob('acc1');

            expect(mockQueue.removeJobScheduler).toHaveBeenCalledWith('key1');
            expect(mockQueue.add).not.toHaveBeenCalled();
        });
    });

    describe('removeAccountRepeatableJob', () => {
        it('should remove repeatable job by key matching name sync:accountId', async () => {
            mockQueue.getJobSchedulers.mockResolvedValue([
                { key: 'key1', name: 'sync:acc1', every: 900000 },
                { key: 'key2', name: 'sync:acc2', every: 900000 },
            ]);

            await SchedulerService.removeAccountRepeatableJob('acc1');

            expect(mockQueue.removeJobScheduler).toHaveBeenCalledWith('key1');
            expect(mockQueue.removeJobScheduler).not.toHaveBeenCalledWith('key2');
        });
    });
});
