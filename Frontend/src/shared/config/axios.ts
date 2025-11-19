import { getAccessToken } from '@auth0/nextjs-auth0';
import { API_BASE_URL } from '@config/config';
import axios from 'axios';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    // withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
    const accessToken = await getAccessToken();
    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
});

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        return Promise.reject(error);
    },
);

export const axiosClient = apiClient;

export const auth0ApiClient = axios.create({
    baseURL: 'http://localhost:3000/auth',
    withCredentials: true,
});
