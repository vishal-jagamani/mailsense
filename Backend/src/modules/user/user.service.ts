import { Auth0Service } from '@providers/auth0/auth0.service.js';
import { APIResponse } from 'types/api.types.js';
import { UserDocument, UserInput } from './user.model.js';
import { UserRepository } from './user.repository.js';
import { UserDetailsObject } from './user.types.js';

export class UserService {
    private auth0Service: Auth0Service;

    constructor() {
        this.auth0Service = new Auth0Service();
    }

    public async getUser(auth0UserId: string) {
        const user = await this.auth0Service.getUserDetails(auth0UserId);
        return user;
    }

    public async updateUser(auth0UserId: string, user: UserDetailsObject): Promise<APIResponse<UserDocument | null>> {
        const updateUser = await this.auth0Service.updateUserDetails(auth0UserId, user);
        const userInput: UserInput = {
            auth0UserId,
            name: updateUser.name,
            email: updateUser.email,
            userMetaData: updateUser.user_metadata,
        };
        const updateInDB = await UserRepository.updateUser(auth0UserId, userInput);
        return { status: true, message: 'User updated successfully', data: updateInDB };
    }
}
