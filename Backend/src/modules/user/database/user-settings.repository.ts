import { UpdateUserAISettingsPayload, UserAISettings } from '@mailsense/types';
import { UserSettingsDocument, UserSettingsInput, UserSettingsModel } from './user.model.js';

export class UserSettingsRepository {
    static async getUserSettings(auth0UserId: string): Promise<UserSettingsDocument | null> {
        return await UserSettingsModel.findOne({ userId: auth0UserId });
    }

    static async createUserSettings(data: UserSettingsInput): Promise<UserSettingsDocument> {
        return await UserSettingsModel.create(data);
    }

    static async updateUserSettings(userId: string, data: UserSettingsInput): Promise<UserSettingsDocument | null> {
        return await UserSettingsModel.findOneAndUpdate({ userId }, data, { new: true });
    }

    static async getAiSettings(userId: string): Promise<UserAISettings | null> {
        const settings = await UserSettingsModel.findOne({ userId }, { ai: 1 }).lean();
        return settings?.ai ?? null;
    }

    static async updateAiSettings(userId: string, payload: UpdateUserAISettingsPayload): Promise<UserSettingsDocument | null> {
        const updateFields: Record<string, boolean | string[] | Date> = {};

        if (payload.enabled !== undefined) {
            updateFields['ai.enabled'] = payload.enabled;
            if (payload.enabled) {
                updateFields['ai.consentGivenAt'] = new Date();
            }
        }

        if (payload.features) {
            if (payload.features.categorization !== undefined) {
                updateFields['ai.features.categorization'] = payload.features.categorization;
            }
            if (payload.features.priorityScoring !== undefined) {
                updateFields['ai.features.priorityScoring'] = payload.features.priorityScoring;
            }
            if (payload.features.summarization !== undefined) {
                updateFields['ai.features.summarization'] = payload.features.summarization;
            }
            if (payload.features.suggestedReplies !== undefined) {
                updateFields['ai.features.suggestedReplies'] = payload.features.suggestedReplies;
            }
        }

        if (payload.disabledAccountIds !== undefined) {
            updateFields['ai.disabledAccountIds'] = payload.disabledAccountIds;
        }

        return await UserSettingsModel.findOneAndUpdate({ userId }, { $set: updateFields }, { new: true, upsert: true, setDefaultsOnInsert: true });
    }
}
