import { auth0ApiClient } from '@shared/config/axios';
import { AUTH_API_ENDPOINTS } from '../constants/api.constants';

export async function fetchUserProfile() {
    const { data } = await auth0ApiClient.get(AUTH_API_ENDPOINTS.PROFILE);
    return data;
}
