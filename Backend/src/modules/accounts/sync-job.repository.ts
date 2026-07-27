import { Types } from 'mongoose';
import { SyncJob, SyncJobDocument, SyncJobInput } from './sync-job.model.js';

export class SyncJobRepository {
    public static async createSyncJob(data: Partial<SyncJobInput>): Promise<SyncJobDocument> {
        return SyncJob.create(data);
    }

    public static async updateSyncJob(bullJobId: string, data: Partial<SyncJobInput>): Promise<SyncJobDocument | null> {
        return SyncJob.findOneAndUpdate({ bullJobId }, data, { new: true });
    }

    public static async getSyncJobByBullId(bullJobId: string): Promise<SyncJobDocument | null> {
        return SyncJob.findOne({ bullJobId });
    }

    public static async getLatestSyncJobForAccount(accountId: string): Promise<SyncJobDocument | null> {
        if (!Types.ObjectId.isValid(accountId)) {
            return null;
        }
        return SyncJob.findOne({ accountId }).sort({ startedAt: -1 });
    }
}
