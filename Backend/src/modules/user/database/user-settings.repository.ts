import { UserAISettings } from '@mailsense/types';
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
}
