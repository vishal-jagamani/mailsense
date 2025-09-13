import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { NODE_ENV } from '@config/config.js';
import { logger } from './logger.js';

const isDev = NODE_ENV !== 'production';

const apiClient: AxiosInstance = axios.create({ timeout: 10000 });

// ✅ Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        if (isDev) {
            logger.debug('➡️ API Request', {
                method: config.method,
                url: config.url,
                params: config.params,
                data: config.data,
            });
        }
        return config;
    },
    (error) => {
        logger.error('❌ API Request Error', { error });
        return Promise.reject(error);
    },
);

// ✅ Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        if (isDev) {
            logger.debug('⬅️ API Response', {
                url: response.config.url,
                status: response.status,
                data: response.data,
            });
        }
        return response;
    },
    (error) => {
        if (error.response) {
            logger.error('❌ API Response Error', {
                url: error.config?.url,
                status: error.response.status,
                data: error.response.data,
            });
        } else {
            logger.error('❌ API Network/Error', { message: error.message });
        }
        return Promise.reject(error);
    },
);

// ✅ Axios instance
export const apiRequest = async <T = AxiosResponse>(options: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.request<T>(options);
    return response.data;
};

export default apiClient;
