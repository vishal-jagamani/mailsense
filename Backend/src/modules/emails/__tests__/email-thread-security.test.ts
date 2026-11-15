import { AccountRepository } from '@modules/accounts/database/index.js';
import { ForbiddenError, NotFoundError } from '../../../core/errors/index.js';
import { EmailProviderFactory } from '../../../integrations/email/email.provider.factory.js';
import { EmailRepository } from '../database/index.js';
import { EmailThreadService } from '../services/email-thread.service.js';

jest.mock('@modules/accounts/database/index.js');
jest.mock('../database/index.js');
jest.mock('../../../integrations/email/email.provider.factory.js');

describe('EmailThreadService - Multi-Tenant Authorization Tests', () => {
    let emailThreadService: EmailThreadService;

    beforeEach(() => {
        jest.clearAllMocks();
        emailThreadService = new EmailThreadService();
    });

    describe('getEmail (BUG-V14-03 Verification)', () => {
        it('should allow legitimate account owner to read email details', async () => {
            const mockEmail = {
                _id: 'em-123',
                accountId: 'acc-1',
                providerMessageId: 'prov-msg-1',
                threadId: 'th-1',
            };
            const mockAccount = {
                _id: 'acc-1',
                userId: 'user-owner',
                provider: 'gmail',
            };
            const mockProvider = {
                getMessageDetails: jest.fn().mockResolvedValue({
                    ...mockEmail,
                    subject: 'Confidential Report',
                }),
            };

            (EmailRepository.getEmail as jest.Mock).mockResolvedValue(mockEmail);
            (AccountRepository.getAccountById as jest.Mock).mockResolvedValue(mockAccount);
            (EmailProviderFactory.getProvider as jest.Mock).mockReturnValue(mockProvider);

            const result = await emailThreadService.getEmail('user-owner', 'em-123');
            expect(result).toBeDefined();
            expect(AccountRepository.getAccountById).toHaveBeenCalledWith('acc-1', {
                provider: 1,
                userId: 1,
            });
            expect(mockProvider.getMessageDetails).toHaveBeenCalledWith('acc-1', 'prov-msg-1', mockEmail);
        });

        it('should reject read with ForbiddenError if email belongs to another user', async () => {
            const mockEmail = {
                _id: 'em-victim',
                accountId: 'acc-victim',
                providerMessageId: 'prov-msg-victim',
            };
            const mockAccount = {
                _id: 'acc-victim',
                userId: 'user-victim',
                provider: 'gmail',
            };

            (EmailRepository.getEmail as jest.Mock).mockResolvedValue(mockEmail);
            (AccountRepository.getAccountById as jest.Mock).mockResolvedValue(mockAccount);

            await expect(emailThreadService.getEmail('attacker-user', 'em-victim')).rejects.toThrow(ForbiddenError);
        });

        it('should throw NotFoundError if email does not exist', async () => {
            (EmailRepository.getEmail as jest.Mock).mockResolvedValue(null);

            await expect(emailThreadService.getEmail('user-owner', 'em-nonexistent')).rejects.toThrow(NotFoundError);
        });
    });
});
