import { Readable } from 'stream';
import { ForbiddenError } from '../../../core/errors/index.js';
import { EmailProviderFactory } from '../../../integrations/email/email.provider.factory.js';
import { AccountRepository } from '../../accounts/account.repository.js';
import { AttachmentsService } from '../../attachments/attachment.service.js';
import { EmailWriteService } from '../services/email-write.service.js';

jest.mock('../../accounts/account.repository.js');
jest.mock('../../../integrations/email/email.provider.factory.js');

describe('EmailWriteService - Attachment Security Tests', () => {
    let emailWriteService: EmailWriteService;
    let mockAttachmentsService: jest.Mocked<Partial<AttachmentsService>>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockAttachmentsService = {
            getStagedAttachmentWithStream: jest.fn(),
            cleanupStagedAttachments: jest.fn().mockResolvedValue(undefined),
        };

        emailWriteService = new EmailWriteService(mockAttachmentsService as unknown as AttachmentsService);
    });

    it('should reject composition with ForbiddenError if attachment belongs to a different user (BUG-V12-02)', async () => {
        const mockAccount = {
            _id: 'acc-1',
            userId: 'attacker-user-123',
            provider: 'gmail',
        };
        (AccountRepository.getAccountById as jest.Mock).mockResolvedValue(mockAccount);

        (mockAttachmentsService.getStagedAttachmentWithStream as jest.Mock).mockResolvedValue({
            stagedAttachment: {
                userId: 'victim-user-999',
                accountId: 'acc-1',
                filename: 'confidential.pdf',
                mimeType: 'application/pdf',
            },
            stream: Readable.from([Buffer.from('secret')]),
        });

        await expect(
            emailWriteService.composeEmail('attacker-user-123', {
                accountId: 'acc-1',
                to: ['recipient@test.com'],
                subject: 'Test Email',
                body: 'Test Body',
                attachmentIds: ['att-victim-1'],
            }),
        ).rejects.toThrow(ForbiddenError);
    });

    it('should reject composition with ForbiddenError if attachment belongs to a different account of the same user', async () => {
        const mockAccount = {
            _id: 'acc-1',
            userId: 'user-123',
            provider: 'gmail',
        };
        (AccountRepository.getAccountById as jest.Mock).mockResolvedValue(mockAccount);

        (mockAttachmentsService.getStagedAttachmentWithStream as jest.Mock).mockResolvedValue({
            stagedAttachment: {
                userId: 'user-123',
                accountId: 'acc-2', // Different account
                filename: 'receipt.pdf',
                mimeType: 'application/pdf',
            },
            stream: Readable.from([Buffer.from('receipt')]),
        });

        await expect(
            emailWriteService.composeEmail('user-123', {
                accountId: 'acc-1',
                to: ['recipient@test.com'],
                subject: 'Test Email',
                body: 'Test Body',
                attachmentIds: ['att-mismatched-acc'],
            }),
        ).rejects.toThrow(ForbiddenError);
    });

    it('should allow email composition when attachment ownership and account match', async () => {
        const mockAccount = {
            _id: 'acc-1',
            userId: 'user-123',
            provider: 'gmail',
        };
        (AccountRepository.getAccountById as jest.Mock).mockResolvedValue(mockAccount);

        (mockAttachmentsService.getStagedAttachmentWithStream as jest.Mock).mockResolvedValue({
            stagedAttachment: {
                userId: 'user-123',
                accountId: 'acc-1',
                filename: 'invoice.pdf',
                mimeType: 'application/pdf',
            },
            stream: Readable.from([Buffer.from('invoice')]),
        });

        const mockProvider = {
            sendMail: jest.fn().mockResolvedValue(undefined),
        };
        (EmailProviderFactory.getProvider as jest.Mock).mockReturnValue(mockProvider);

        const result = await emailWriteService.composeEmail('user-123', {
            accountId: 'acc-1',
            to: ['client@test.com'],
            subject: 'Invoice Attached',
            body: 'Please find attached invoice.',
            attachmentIds: ['att-valid-1'],
        });

        expect(result.status).toBe(true);
        expect(mockProvider.sendMail).toHaveBeenCalled();
        expect(mockAttachmentsService.cleanupStagedAttachments).toHaveBeenCalledWith(['att-valid-1']);
    });
});
