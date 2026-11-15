import { StagedAttachmentDocument, StagedAttachmentInput, StagedAttachmentModel } from './attachment.model.js';

export class StagedAttachmentRepository {
    public static async createStagedAttachment(data: Partial<StagedAttachmentInput>): Promise<StagedAttachmentDocument> {
        return StagedAttachmentModel.create(data);
    }

    public static async updateStagedAttachment(attachmentId: string, data: Partial<StagedAttachmentInput>): Promise<StagedAttachmentDocument | null> {
        return StagedAttachmentModel.findOneAndUpdate({ _id: attachmentId }, data, { new: true });
    }

    public static async getStagedAttachmentById(attachmentId: string): Promise<StagedAttachmentDocument | null> {
        return StagedAttachmentModel.findOne({ _id: attachmentId });
    }

    public static async getStagedAttachmentsByIds(attachmentIds: string[]): Promise<StagedAttachmentDocument[]> {
        return StagedAttachmentModel.find({ _id: { $in: attachmentIds } });
    }

    public static async deleteStagedAttachments(attachmentIds: string[]): Promise<void> {
        await StagedAttachmentModel.deleteMany({ _id: { $in: attachmentIds } });
    }
}
