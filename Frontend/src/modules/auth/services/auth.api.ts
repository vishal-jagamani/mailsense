import { auth0ApiClient } from '@shared/config/axios';

export async function fetchUserProfile() {
    const { data } = await auth0ApiClient.get('/profile');
    return data;
}
