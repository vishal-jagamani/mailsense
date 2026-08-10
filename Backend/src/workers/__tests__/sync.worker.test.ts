import { EmailProviderFactory } from '@integrations/email/email.provider.factory.js';
import { IEmailProvider } from '@integrations/email/email.provider.js';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { EmailRepository } from '@modules/emails/email.repository.js';
import { FolderService } from '@modules/folders/folder.service.js';
import { Job } from 'bullmq';
import { SyncAccountPayload } from 'core/queue/queue.service.js';
import { syncAccountProcessor } from '../processors/sync-account.processor.js';
import { SyncJobResult } from '@mailsense/types';

jest.mock('@modules/accounts/account.repository.js');
jest.mock('@modules/emails/email.repository.js');
jest.mock('@modules/folders/folder.service.js');
jest.mock('@integrations/email/email.provider.factory.js');

describe('syncAccountProcessor', () => {
    let mockJob: Partial<Job<SyncAccountPayload, SyncJobResult>>;
    let mockProvider: IEmailProvider;

    beforeEach(() => {
        mockJob = {
            data: { accountId: 'account-123', userId: 'user-123' },
            id: 'job-123',
        };

        mockProvider = {
            fetchMessages: jest.fn(),
            getAccessTokenFromCode: jest.fn(),
            getUserProfileFromAccessToken: jest.fn(),
            refreshAccessToken: jest.fn(),
            getMessageDetails: jest.fn(),
            deleteEmails: jest.fn(),
            archiveEmails: jest.fn(),
            unreadEmails: jest.fn(),
            starEmails: jest.fn(),
            sendMail: jest.fn(),
            searchContacts: jest.fn(),
            getAttachment: jest.fn(),
            getAllFolders: jest.fn(),
            createFolder: jest.fn(),
            updateFolder: jest.fn(),
            deleteFolder: jest.fn(),
        };

        (EmailProviderFactory.getProvider as jest.Mock).mockReturnValue(mockProvider);
        (FolderService.prototype.syncFolders as jest.Mock).mockResolvedValue({ status: true, message: 'folders synced' });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should perform incremental sync when history details are found', async () => {
        const mockAccount = {
            _id: 'account-123',
            provider: 'gmail',
            active: true,
            syncEnabled: true,
            lastSyncCursor: 'cursor-old',
            userId: 'user-123',
        };

        (AccountRepository.getAccountById as jest.Mock).mockResolvedValue(mockAccount);
        jest.mocked(mockProvider.fetchMessages).mockResolvedValue({
            addedEmails: [{ providerMessageId: 'email-1', accountId: 'account-123' }],
            deletedEmailIds: ['email-old'],
            newCursor: 'cursor-new',
        });

        const result = await syncAccountProcessor(mockJob as Job<SyncAccountPayload, SyncJobResult>);

        expect(AccountRepository.getAccountById).toHaveBeenCalledWith('account-123');
        expect(mockProvider.fetchMessages).toHaveBeenCalledWith('account-123', 'cursor-old');
        expect(EmailRepository.deleteManyEmails).toHaveBeenCalledWith(['email-old']);
        expect(EmailRepository.upsertEmailsInBulk).toHaveBeenCalledWith([{ providerMessageId: 'email-1', accountId: 'account-123' }]);
        expect(AccountRepository.updateAccount).toHaveBeenCalledWith('account-123', {
            lastSyncedAt: expect.any(Number),
            lastSyncCursor: 'cursor-new',
        });
        expect(result).toEqual({ addedEmailsCount: 1, deletedEmailsCount: 1 });
    });

    it('should perform full sync when no history details are found', async () => {
        const mockAccount = {
            _id: 'account-123',
            provider: 'gmail',
            active: true,
            syncEnabled: true,
            lastSyncCursor: null,
            userId: 'user-123',
        };

        (AccountRepository.getAccountById as jest.Mock).mockResolvedValue(mockAccount);
        jest.mocked(mockProvider.fetchMessages)
            .mockResolvedValueOnce(null) // Incremental returns null
            .mockResolvedValueOnce({
                addedEmails: [{ providerMessageId: 'email-2', accountId: 'account-123' }],
                deletedEmailIds: [],
                newCursor: 'cursor-full-new',
            }); // Full sync returns emails

        const result = await syncAccountProcessor(mockJob as Job<SyncAccountPayload, SyncJobResult>);

        expect(mockProvider.fetchMessages).toHaveBeenNthCalledWith(1, 'account-123', null);
        expect(mockProvider.fetchMessages).toHaveBeenNthCalledWith(2, 'account-123');
        expect(EmailRepository.deleteEmailsByAccountId).toHaveBeenCalledWith('account-123');
        expect(EmailRepository.upsertEmailsInBulk).toHaveBeenCalledWith([{ providerMessageId: 'email-2', accountId: 'account-123' }]);
        expect(AccountRepository.updateAccount).toHaveBeenCalledWith('account-123', {
            lastSyncedAt: expect.any(Number),
            lastSyncCursor: 'cursor-full-new',
        });
        expect(result).toEqual({ addedEmailsCount: 1, deletedEmailsCount: 0 });
    });
});
