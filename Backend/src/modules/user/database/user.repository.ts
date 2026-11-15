import { User, UserInput } from './user.model.js';

export class UserRepository {
    static async updateUser(auth0UserId: string, user: UserInput) {
        const response = await User.findOneAndUpdate({ auth0UserId }, user, { new: true });
        return response;
    }
}
