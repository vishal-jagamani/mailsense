import { AccountRepository } from '@modules/accounts/database/index.js';
import { ForbiddenError, NotFoundError } from '../../../core/errors/index.js';
import { AttachmentsService } from '../services/index.js';
import { UploadStageAttachmentFile } from '../types/index.js';

jest.mock('@modules/accounts/database/index.js');
jest.mock('../database/index.js');
jest.mock('../../../integrations/storage/ObjectStorageService.service.js');

describe('AttachmentsService - Upload Security Tests (BUG-V14-07)', () => {
    let attachmentsService: AttachmentsService;
    const mockFile: UploadStageAttachmentFile = {
        originalname: 'invoice.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('dummy-pdf'),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        attachmentsService = new AttachmentsService();
    });

    it('should reject staging attachment if account does not belong to authenticated user', async () => {
        (AccountRepository.getAccountById as jest.Mock).mockResolvedValue({
            _id: 'acc-victim',
            userId: 'victim-user-999',
        });

        await expect(attachmentsService.uploadStagedAttachment('attacker-user-123', 'acc-victim', mockFile)).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError if account does not exist', async () => {
        (AccountRepository.getAccountById as jest.Mock).mockResolvedValue(null);

        await expect(attachmentsService.uploadStagedAttachment('user-123', 'acc-nonexistent', mockFile)).rejects.toThrow(NotFoundError);
    });
});
