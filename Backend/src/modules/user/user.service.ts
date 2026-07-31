import { ACCOUNT_SYNC_MODE, APIResponse, UpdateAPIResponse, UserDetailsObject, UserSettings } from '@mailsense/types';
import { Auth0Service } from 'integrations/auth0/auth0.service.js';
import { Auth0UserDetailsResponse } from 'integrations/auth0/auth0.types.js';
import { decrypt } from 'shared/utils/index.js';
import { UserDocument, UserInput, UserSettingsDocument } from './user.model.js';
import { UserRepository } from './user.repository.js';
import { ChangePasswordSchema, UpdateUserSchema } from './user.schema.js';
import { UserSettingsRepository } from './user-settings.repository.js';

export class UserService {
    private auth0Service: Auth0Service;

    constructor() {
        this.auth0Service = new Auth0Service();
    }

    public async getUser(auth0UserId: string): Promise<APIResponse<Auth0UserDetailsResponse | null>> {
        const user = await this.auth0Service.getUserDetails(auth0UserId);
        return { status: true, message: 'User fetched successfully', data: user };
    }

    public async updateUser(auth0UserId: string, user: UpdateUserSchema): Promise<APIResponse<UserDocument | null>> {
        const updateUser = await this.auth0Service.updateUserDetails(auth0UserId, user);
        const userInput: UserInput = {
            auth0UserId,
            name: updateUser.name,
            email: updateUser.email,
        };
        const updateInDB = await UserRepository.updateUser(auth0UserId, userInput);
        return { status: true, message: 'User updated successfully', data: updateInDB };
    }

    public async getUserProfile(auth0UserId: string): Promise<APIResponse<UserDetailsObject | null>> {
        const user = await this.auth0Service.getUserProfileDetails(auth0UserId);
        if (!user) {
            return { status: false, message: 'User not found', data: null };
        }
        return { status: true, message: 'User profile fetched successfully', data: user };
    }

    public async changePassword(auth0UserId: string, user: ChangePasswordSchema): Promise<UpdateAPIResponse> {
        const userDetails = await this.auth0Service.getUserDetails(auth0UserId);
        if (!userDetails) {
            throw new Error('User not found');
        }
        const changePasswordBody = {
            password: decrypt(user.password),
            connection: userDetails.identities[0].connection,
        };
        await this.auth0Service.changeUserPassword(auth0UserId, changePasswordBody);
        return { status: true, message: 'Password updated successfully' };
    }

    public async getUserSettings(auth0UserId: string): Promise<APIResponse<UserSettings>> {
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
    }

    public async updateUserSettings(auth0UserId: string, data: UserSettings): Promise<APIResponse<UserSettingsDocument | null>> {
        const userSettings = await UserSettingsRepository.updateUserSettings(auth0UserId, data);
        if (!userSettings) {
            return { status: false, message: 'User settings not found', data: null };
        }
        return { status: true, message: 'User settings updated successfully', data: userSettings };
    }
}
