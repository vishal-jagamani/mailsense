import { AccountDocument } from '../account.model.js';
import { AccountRepository } from '../account.repository.js';
import { AccountsService } from '../account.service.js';

describe('AccountsService — Token Sanitization (`BUG-V12-05`)', () => {
    let service: AccountsService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new AccountsService();
    });

    it('should strip accessToken, refreshToken, and sensitive tokens from getAccounts() response', async () => {
        const mockRawAccounts = [
            {
                _id: 'acc-1',
                userId: 'user-100',
                emailAddress: 'test@gmail.com',
                provider: 'gmail',
                syncEnabled: true,
                syncFrequency: 'realtime',
                totalEmails: 10,
                unreadEmails: 2,
                accessToken: 'secret_access_token_abc',
                refreshToken: 'secret_refresh_token_xyz',
                accessTokenExpiry: Date.now() + 3600000,
            },
        ] as unknown as AccountDocument[];

        jest.spyOn(AccountRepository, 'getAccounts').mockResolvedValue(
            mockRawAccounts as unknown as Awaited<ReturnType<typeof AccountRepository.getAccounts>>,
        );

        const accounts = await service.getAccounts('user-100');

        expect(accounts).toHaveLength(1);
        const [sanitized] = accounts;

        expect(sanitized._id).toBe('acc-1');
        expect(sanitized.email).toBe('test@gmail.com');
        expect(sanitized.provider).toBe('gmail');

        // Tokens must be strictly undefined
        expect((sanitized as unknown as Record<string, unknown>).accessToken).toBeUndefined();
        expect((sanitized as unknown as Record<string, unknown>).refreshToken).toBeUndefined();
        expect((sanitized as unknown as Record<string, unknown>).accessTokenExpiry).toBeUndefined();
    });
});
