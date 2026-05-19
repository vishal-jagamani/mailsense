import axios, { AxiosError } from 'axios';
import { AppError } from './AppError.js';

export class AxiosApiError extends AppError {
    public originalError: unknown;

    constructor(error: unknown) {
        if (axios.isAxiosError(error)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = error as AxiosError<any>;

            const status = axiosError.response?.status || 500;

            const message =
                axiosError.response?.data?.error?.message || axiosError.response?.data?.message || axiosError.message || 'External API Error';

            super({
                message,
                status,
                error: axiosError?.response?.data,
            });
            this.originalError = axiosError.response?.data || axiosError;
        } else {
            super({
                message: 'Unknown external API error',
                status: 500,
            });

            this.originalError = error;
        }
    }
}
