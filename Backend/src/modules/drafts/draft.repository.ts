import { DraftDocument, DraftInput, DraftModel } from './draft.model.js';

export class DraftRepository {
    public static async createDraft(draft: Partial<DraftInput>) {
        return DraftModel.create(draft);
    }

    public static async updateDraft(draftId: string, draft: Partial<DraftInput>) {
        return DraftModel.findByIdAndUpdate(draftId, draft, { new: true, upsert: true });
    }

    public static async getDraftById(draftId: string, userId: string): Promise<DraftDocument | null> {
        return await DraftModel.findOne({ _id: draftId, userId });
    }

    public static async getDraftsByUserId(userId: string): Promise<DraftDocument[]> {
        return await DraftModel.find({ userId }).sort({ lastSavedAt: -1 });
    }

    public static async deleteDraftById(draftId: string, userId: string): Promise<boolean> {
        const result = await DraftModel.deleteOne({ _id: draftId, userId });
        return result.deletedCount > 0;
    }

    public static async getDraftCountByUserId(userId: string): Promise<number> {
        return await DraftModel.countDocuments({ userId });
    }
}
