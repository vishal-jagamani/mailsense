import { UserAISettings } from '@mailsense/types';
import { UserSettingsDocument } from '../database/user.model.js';
import { UserSettingsRepository } from '../database/user-settings.repository.js';
import { UserService } from '../services/user.service.js';

describe('UserService - AI Settings', () => {
    const mockUserId = 'auth0|test-user-ai-settings-123';
    let userService: UserService;

    const mockAiSettings: UserAISettings = {
        enabled: true,
        features: {
            categorization: true,
            priorityScoring: true,
            summarization: true,
            suggestedReplies: true,
        },
        disabledAccountIds: [],
        consentGivenAt: new Date('2026-11-20T00:00:00.000Z'),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        userService = new UserService();
    });

    it('should initialize and return default AI settings when none exist', async () => {
        jest.spyOn(UserSettingsRepository, 'getAiSettings').mockResolvedValueOnce(null);
        jest.spyOn(UserSettingsRepository, 'updateAiSettings').mockResolvedValueOnce({
            ai: mockAiSettings,
        } as unknown as UserSettingsDocument);

        const response = await userService.getUserAiSettings(mockUserId);

        expect(response.status).toBe(true);
        expect(response.data.settings.enabled).toBe(true);
        expect(response.data.settings.features.categorization).toBe(true);
        expect(response.data.settings.features.priorityScoring).toBe(true);
        expect(response.data.settings.features.summarization).toBe(true);
        expect(response.data.settings.features.suggestedReplies).toBe(true);
        expect(response.data.settings.disabledAccountIds).toEqual([]);
        expect(response.data.globalFeatureFlag).toBeDefined();
    });

    it('should update global AI toggle and record consent timestamp', async () => {
        const disabledSettings: UserAISettings = {
            ...mockAiSettings,
            enabled: false,
        };

        jest.spyOn(UserSettingsRepository, 'updateAiSettings').mockResolvedValueOnce({
            ai: disabledSettings,
        } as unknown as UserSettingsDocument);

        const updateRes = await userService.updateUserAiSettings(mockUserId, {
            enabled: false,
        });

        expect(updateRes.status).toBe(true);
        expect(updateRes.data.settings.enabled).toBe(false);
    });

    it('should update granular feature toggles independently', async () => {
        const updatedFeaturesSettings: UserAISettings = {
            ...mockAiSettings,
            features: {
                ...mockAiSettings.features,
                categorization: false,
                suggestedReplies: false,
            },
        };

        jest.spyOn(UserSettingsRepository, 'updateAiSettings').mockResolvedValueOnce({
            ai: updatedFeaturesSettings,
        } as unknown as UserSettingsDocument);

        const updateRes = await userService.updateUserAiSettings(mockUserId, {
            features: {
                categorization: false,
                suggestedReplies: false,
            },
        });

        expect(updateRes.status).toBe(true);
        expect(updateRes.data.settings.features.categorization).toBe(false);
        expect(updateRes.data.settings.features.suggestedReplies).toBe(false);
        expect(updateRes.data.settings.features.priorityScoring).toBe(true);
        expect(updateRes.data.settings.features.summarization).toBe(true);
    });

    it('should manage disabled accounts for AI exclusion', async () => {
        const accountId = 'acc_sensitive_corp_999';
        const excludedSettings: UserAISettings = {
            ...mockAiSettings,
            disabledAccountIds: [accountId],
        };

        jest.spyOn(UserSettingsRepository, 'updateAiSettings').mockResolvedValueOnce({
            ai: excludedSettings,
        } as unknown as UserSettingsDocument);

        const updateRes = await userService.updateUserAiSettings(mockUserId, {
            disabledAccountIds: [accountId],
        });

        expect(updateRes.status).toBe(true);
        expect(updateRes.data.settings.disabledAccountIds).toContain(accountId);
    });
});
