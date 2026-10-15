import { ForbiddenError, NotFoundError } from '../../../core/errors/index.js';
import { AccountRepository } from '../account.repository.js';
import { AccountsService } from '../account.service.js';

jest.mock('../account.repository.js');
jest.mock('../../../core/queue/scheduler.service.js', () => ({
    SchedulerService: {
        upsertAccountRepeatableJob: jest.fn().mockResolvedValue(undefined),
    },
}));

describe('AccountsService - updateAccountSettings Security Tests', () => {
    let accountsService: AccountsService;

    beforeEach(() => {
        jest.clearAllMocks();
        accountsService = new AccountsService();
    });

    it('should throw NotFoundError if target account does not exist', async () => {
        (AccountRepository.getAccountById as jest.Mock).mockResolvedValue(null);

        await expect(accountsService.updateAccountSettings('user-123', 'acc-nonexistent', { syncEnabled: true })).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if requesting user does not own the account (IDOR)', async () => {
        const mockAccount = {
            _id: 'acc-999',
            userId: 'legitimate-owner-456',
            provider: 'gmail',
        };
        (AccountRepository.getAccountById as jest.Mock).mockResolvedValue(mockAccount);

        await expect(accountsService.updateAccountSettings('attacker-user-123', 'acc-999', { syncEnabled: false })).rejects.toThrow(ForbiddenError);
    });

    it('should allow settings update when user owns the account', async () => {
        const mockAccount = {
            _id: 'acc-999',
            userId: 'user-123',
            provider: 'gmail',
        };
        (AccountRepository.getAccountById as jest.Mock).mockResolvedValue(mockAccount);
        (AccountRepository.updateAccount as jest.Mock).mockResolvedValue(undefined);

        const result = await accountsService.updateAccountSettings('user-123', 'acc-999', { syncInterval: 15 });

        expect(result.status).toBe(true);
        expect(AccountRepository.updateAccount).toHaveBeenCalledWith('acc-999', { syncInterval: 15 });
    });
});
