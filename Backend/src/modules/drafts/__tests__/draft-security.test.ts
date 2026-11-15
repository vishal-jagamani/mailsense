import { NotFoundError } from '@errors';
import { DraftModel } from '../database/index.js';
import { DraftService } from '../services/index.js';

jest.mock('../database/draft.model.js', () => ({
    DraftModel: {
        findOneAndUpdate: jest.fn(),
    },
}));

describe('DraftService - Multi-Tenant Authorization Tests', () => {
    let draftService: DraftService;

    beforeEach(() => {
        jest.clearAllMocks();
        draftService = new DraftService();
    });

    it('should reject updating a draft belonging to a different user with NotFoundError (BUG-V14-04)', async () => {
        // Mock findOneAndUpdate returning null when scoped by userId
        (DraftModel.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

        await expect(
            draftService.saveDraft('attacker-user', {
                draftId: 'victim-draft-id',
                accountId: 'acc-1',
                to: ['target@test.com'],
                subject: 'Overwritten Subject',
                body: 'Hacked Body',
            }),
        ).rejects.toThrow(NotFoundError);

        expect(DraftModel.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: 'victim-draft-id', userId: 'attacker-user' },
            expect.objectContaining({ subject: 'Overwritten Subject' }),
            { new: true },
        );
    });

    it('should allow legitimate owner to update their own draft', async () => {
        const mockDraft = {
            _id: 'my-draft-id',
            userId: 'user-owner',
            accountId: 'acc-1',
            to: ['recipient@test.com'],
            subject: 'Updated Subject',
            body: '<p>Updated Body</p>',
            bodyPlain: 'Updated Body',
            lastSavedAt: new Date(),
        };

        (DraftModel.findOneAndUpdate as jest.Mock).mockResolvedValue(mockDraft);

        const result = await draftService.saveDraft('user-owner', {
            draftId: 'my-draft-id',
            accountId: 'acc-1',
            to: ['recipient@test.com'],
            subject: 'Updated Subject',
            body: '<p>Updated Body</p>',
        });

        expect(result).toBeDefined();
        expect(result.subject).toBe('Updated Subject');
        expect(DraftModel.findOneAndUpdate).toHaveBeenCalledWith({ _id: 'my-draft-id', userId: 'user-owner' }, expect.any(Object), { new: true });
    });
});
