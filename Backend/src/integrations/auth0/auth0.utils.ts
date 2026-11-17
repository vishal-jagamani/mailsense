import { UpdateUserSchema } from '@modules/user/schema/user.schema.js';
import { Auth0UpdateUserPayload } from './auth0.types.js';

export const buildAuth0UpdatePayload = (user: UpdateUserSchema): Auth0UpdateUserPayload => {
    const payload: Auth0UpdateUserPayload = {};
    if (user.name !== undefined) payload.name = user.name;
    if (user.nickname !== undefined) payload.nickname = user.nickname;
    if (user.picture !== undefined) payload.picture = user.picture;
    if (user.email !== undefined) payload.email = user.email;
    if (user.user_metadata !== undefined) payload.user_metadata = user.user_metadata;
    if (user.email_verified !== undefined) payload.email_verified = user.email_verified;
    return payload;
};
