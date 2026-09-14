import { getAccessToken } from '@auth0/nextjs-auth0/client';
import { API_BASE_URL } from '@config/config';
import { trackUserAction } from '@shared/monitoring';
import { useAuthStore } from '@shared/store';
import axios from 'axios';
import { extractApiError } from './errors';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(async (config) => {
    try {
        const accessToken = await getAccessToken();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        if (!config.headers['X-Trace-Id'] && !config.headers['x-trace-id']) {
            config.headers['X-Trace-Id'] = crypto.randomUUID();
        }

        // Attach user context headers so backend tracing and logs capture user details
        const user = useAuthStore.getState().user;
        if (user) {
            if (user.id) config.headers['X-User-Id'] = user.id;
            if (user.email) config.headers['X-User-Email'] = user.email;
            if (user.name) config.headers['X-User-Name'] = encodeURIComponent(user.name);
        }

        trackUserAction('api.request', `${config.method?.toUpperCase() || 'GET'} ${config.url || ''}`, 'info', {
            method: config.method?.toUpperCase() || 'GET',
            url: config.url || '',
            ...(user?.id ? { userId: user.id } : {}),
            ...(user?.email ? { userEmail: user.email } : {}),
        });

        return config;
    } catch (tokenError) {
        return config;
    }
});

apiClient.interceptors.response.use(
    (response) => {
        try {
            trackUserAction(
                'api.response',
                `${response.config.method?.toUpperCase() || 'GET'} ${response.config.url || ''} [${response.status}]`,
                'info',
                {
                    status: response.status,
                    url: response.config.url || '',
                },
            );
        } catch {
            // Non-blocking
        }
        return response;
    },
    (error) => {
        try {
            const formatted = extractApiError(error);

            const responseHeaderTraceId = error.response?.headers?.['x-trace-id'];
            if (responseHeaderTraceId && (!formatted.traceId || formatted.traceId.length === 0)) {
                formatted.traceId = String(responseHeaderTraceId);
            }

            trackUserAction(
                'api.error',
                `${error.config?.method?.toUpperCase() || 'REQ'} ${error.config?.url || ''} [${error.response?.status || 'network_error'}]`,
                'error',
                {
                    status: error.response?.status || 0,
                    message: formatted.message,
                    errorCode: formatted.errorCode,
                    traceId: formatted.traceId,
                },
            );

            Object.assign(error, { formattedError: formatted });
        } catch (interceptorError) {
            // Non-blocking fallback
        }
        return Promise.reject(error);
    },
);

export const axiosClient = apiClient;

export const auth0ApiClient = axios.create({
    baseURL: 'http://localhost:3000/auth',
    withCredentials: true,
});
