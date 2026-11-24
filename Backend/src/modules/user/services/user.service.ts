import { AI_CONFIG } from '@config';
import { LOGGER_MODULE } from '@constants';
import { NotFoundError } from '@errors';
import {
    ACCOUNT_SYNC_MODE,
    AI_PROVIDER_NAME,
    APIResponse,
    GetUserAISettingsResponse,
    UpdateAPIResponse,
    UpdateUserAISettingsPayload,
    UserAISettings,
    UserDetailsObject,
    UserSettings,
} from '@mailsense/types';
import { createLogger } from '@observability';
import { Auth0Service } from 'integrations/auth0/auth0.service.js';
import { Auth0UserDetailsResponse } from 'integrations/auth0/auth0.types.js';
import { decrypt } from 'shared/utils/index.js';
import { UserDocument, UserInput, UserRepository, UserSettingsDocument, UserSettingsRepository } from '../database/index.js';
import { ChangePasswordSchema, UpdateUserSchema } from '../schema/index.js';

const logger = createLogger(LOGGER_MODULE.USER_SERVICE);

export class UserService {
    private auth0Service: Auth0Service;

    constructor() {
        this.auth0Service = new Auth0Service();
    }

    public async getUser(auth0UserId: string): Promise<APIResponse<Auth0UserDetailsResponse | null>> {
        try {
            logger.info('Fetching user details from Auth0', { auth0UserId });
            const user = await this.auth0Service.getUserDetails(auth0UserId);
            return { status: true, message: 'User fetched successfully', data: user };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in UserService.getUser: ${errorMessage}`, { auth0UserId, error: err });
            throw err;
        }
    }

    public async updateUser(auth0UserId: string, user: UpdateUserSchema): Promise<APIResponse<UserDocument | null>> {
        try {
            logger.info('Updating user details', { auth0UserId, user });
            const updateUser = await this.auth0Service.updateUserDetails(auth0UserId, user);
            const userInput: UserInput = {
                auth0UserId,
                name: updateUser.name,
                email: updateUser.email,
            };
            const updateInDB = await UserRepository.updateUser(auth0UserId, userInput);
            return { status: true, message: 'User updated successfully', data: updateInDB };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in UserService.updateUser: ${errorMessage}`, { auth0UserId, error: err });
            throw err;
        }
    }

    public async getUserProfile(auth0UserId: string): Promise<APIResponse<UserDetailsObject | null>> {
        try {
            logger.info('Fetching user profile details', { auth0UserId });
            const user = await this.auth0Service.getUserProfileDetails(auth0UserId);
            if (!user) {
                return { status: false, message: 'User not found', data: null };
            }
            return { status: true, message: 'User profile fetched successfully', data: user };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in UserService.getUserProfile: ${errorMessage}`, { auth0UserId, error: err });
            throw err;
        }
    }

    public async changePassword(auth0UserId: string, user: ChangePasswordSchema): Promise<UpdateAPIResponse> {
        try {
            logger.info('Initiating user password update', { auth0UserId });
            const userDetails = await this.auth0Service.getUserDetails(auth0UserId);
            if (!userDetails) {
                throw new NotFoundError('User', auth0UserId);
            }
            const changePasswordBody = {
                password: decrypt(user.password),
                connection: userDetails.identities[0].connection,
            };
            await this.auth0Service.changeUserPassword(auth0UserId, changePasswordBody);
            return { status: true, message: 'Password updated successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in UserService.changePassword: ${errorMessage}`, { auth0UserId, error: err });
            throw err;
        }
    }

    public async getUserSettings(auth0UserId: string): Promise<APIResponse<UserSettings>> {
        try {
            logger.info('Fetching user settings', { auth0UserId });
            let userSettings = await UserSettingsRepository.getUserSettings(auth0UserId);
            if (!userSettings) {
                const data = {
                    userId: auth0UserId,
                    account: {
                        syncSettings: {
                            globalAutoSync: true,
                            syncMode: ACCOUNT_SYNC_MODE.CUSTOM_PER_ACCOUNT,
                            globalSyncInterval: 15,
                            defaultSyncInterval: 15,
                        },
                    },
                };
                userSettings = await UserSettingsRepository.createUserSettings(data);
            }
            return { status: true, message: 'User settings fetched successfully', data: userSettings };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in UserService.getUserSettings: ${errorMessage}`, { auth0UserId, error: err });
            throw err;
        }
    }

    public async updateUserSettings(auth0UserId: string, data: UserSettings): Promise<APIResponse<UserSettingsDocument | null>> {
        try {
            logger.info('Updating user settings', { auth0UserId, data });
            const userSettings = await UserSettingsRepository.updateUserSettings(auth0UserId, data);
            if (!userSettings) {
                return { status: false, message: 'User settings not found', data: null };
            }
            return { status: true, message: 'User settings updated successfully', data: userSettings };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in UserService.updateUserSettings: ${errorMessage}`, { auth0UserId, data, error: err });
            throw err;
        }
    }

    public async getUserAiSettings(auth0UserId: string): Promise<APIResponse<GetUserAISettingsResponse>> {
        try {
            logger.info('Fetching user AI settings', { auth0UserId });
            const globalFeatureFlag = AI_CONFIG.provider !== AI_PROVIDER_NAME.NOOP;
            let aiSettings = await UserSettingsRepository.getAiSettings(auth0UserId);

            if (!aiSettings) {
                const defaultAiSettings: UserAISettings = {
                    enabled: true,
                    features: {
                        categorization: true,
                        priorityScoring: true,
                        summarization: true,
                        suggestedReplies: true,
                    },
                    disabledAccountIds: [],
                    consentGivenAt: new Date(),
                };
                const userDoc = await UserSettingsRepository.updateAiSettings(auth0UserId, defaultAiSettings);
                aiSettings = userDoc?.ai ?? defaultAiSettings;
            }

            return {
                status: true,
                message: 'User AI settings fetched successfully',
                data: {
                    settings: aiSettings,
                    globalFeatureFlag,
                },
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in UserService.getUserAiSettings: ${errorMessage}`, { auth0UserId, error: err });
            throw err;
        }
    }

    public async updateUserAiSettings(auth0UserId: string, payload: UpdateUserAISettingsPayload): Promise<APIResponse<GetUserAISettingsResponse>> {
        try {
            logger.info('Updating user AI settings', { auth0UserId, payload });
            const updatedDoc = await UserSettingsRepository.updateAiSettings(auth0UserId, payload);
            const globalFeatureFlag = AI_CONFIG.provider !== AI_PROVIDER_NAME.NOOP;
            const aiSettings = this.resolveAiSettings(updatedDoc, payload);

            return {
                status: true,
                message: 'User AI settings updated successfully',
                data: {
                    settings: aiSettings,
                    globalFeatureFlag,
                },
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in UserService.updateUserAiSettings: ${errorMessage}`, { auth0UserId, payload, error: err });
            throw err;
        }
    }

    private resolveAiSettings(updatedDoc: UserSettingsDocument | null, payload: UpdateUserAISettingsPayload): UserAISettings {
        if (updatedDoc?.ai) {
            return updatedDoc.ai;
        }
        return this.createDefaultAiSettings(payload);
    }

    private resolveAiFeatures(features?: UpdateUserAISettingsPayload['features']): UserAISettings['features'] {
        return {
            categorization: features?.categorization ?? true,
            priorityScoring: features?.priorityScoring ?? true,
            summarization: features?.summarization ?? true,
            suggestedReplies: features?.suggestedReplies ?? true,
        };
    }

    private createDefaultAiSettings(payload: UpdateUserAISettingsPayload): UserAISettings {
        return {
            enabled: payload.enabled ?? true,
            features: this.resolveAiFeatures(payload.features),
            disabledAccountIds: payload.disabledAccountIds ?? [],
            consentGivenAt: new Date(),
        };
    }
}
