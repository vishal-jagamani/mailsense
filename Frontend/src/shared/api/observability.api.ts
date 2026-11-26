import { API_BASE_URL } from '@config/config';
import { ReportClientErrorPayload, ReportClientErrorResponse } from '@mailsense/types';
import { trackUserAction } from '@shared/monitoring';
import axios from 'axios';
import { OBSERVABILITY_API_ENDPOINTS } from './endpoints';

const clientErrorHttp = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
});

export async function reportClientError(payload: ReportClientErrorPayload): Promise<ReportClientErrorResponse | null> {
    try {
        const response = await clientErrorHttp.post<ReportClientErrorResponse>(OBSERVABILITY_API_ENDPOINTS.CLIENT_ERRORS, payload, {
            headers: payload.traceId ? { 'X-Trace-Id': payload.traceId } : undefined,
        });
        return response.data;
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        trackUserAction('api.error', `Failed to bridge client error to observability API: ${msg}`, 'warn');
        return null;
    }
}
