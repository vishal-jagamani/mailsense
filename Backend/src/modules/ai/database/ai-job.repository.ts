import { AiJobInput } from '../types/index.js';
import { AiJob, AiJobDocument } from './ai-job.model.js';

export class AiJobRepository {
    public static async upsertBackgroundJob(bullJobId: string, data: Partial<AiJobInput>): Promise<AiJobDocument | null> {
        return await AiJob.findOneAndUpdate({ bullJobId }, { $set: data }, { upsert: true, new: true, setDefaultsOnInsert: true });
    }

    public static async updateBackgroundJob(bullJobId: string, data: Partial<AiJobInput>): Promise<AiJobDocument | null> {
        return await AiJob.findOneAndUpdate({ bullJobId }, { $set: data }, { new: true });
    }

    public static async createOnDemandJob(data: Partial<AiJobInput>): Promise<AiJobDocument> {
        return await AiJob.create(data);
    }

    public static async getJobByBullId(bullJobId: string): Promise<AiJobDocument | null> {
        return await AiJob.findOne({ bullJobId });
    }

    public static async getLatestJobsByUser(userId: string, limit: number = 50): Promise<AiJobDocument[]> {
        return await AiJob.find({ userId }).sort({ startedAt: -1 }).limit(limit);
    }

    public static async deleteJobsByAccountId(accountId: string): Promise<number> {
        const result = await AiJob.deleteMany({ accountId });
        return result.deletedCount ?? 0;
    }

    public static async deleteJobsByUserId(userId: string): Promise<number> {
        const result = await AiJob.deleteMany({ userId });
        return result.deletedCount ?? 0;
    }
}
