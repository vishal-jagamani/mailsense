import { auth0ApiClient, AUTH_API_ENDPOINTS } from '@shared/api';

export async function fetchUserProfile() {
    const { data } = await auth0ApiClient.get(AUTH_API_ENDPOINTS.PROFILE);
    return data;
}
