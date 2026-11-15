import { EmailAttributes, GetThreadResponse } from '@mailsense/types';
import { EMAIL_QUERY_KEYS, extractApiError } from '@shared/api';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { UseGetEmailDetailsQueryOptions, UseGetThreadQueryOptions } from '../types/email-api.types';
import { getEmailDetails, getThread } from './email.api';

export const useGetEmailDetailsQuery = (emailId: string, options?: UseGetEmailDetailsQueryOptions): UseQueryResult<EmailAttributes> => {
    return useQuery<EmailAttributes, Error>({
        queryKey: EMAIL_QUERY_KEYS.detail(emailId),
        queryFn: () => getEmailDetails(emailId),
        ...options,
    });
};

export const useGetThreadQuery = (emailId: string, options?: UseGetThreadQueryOptions): UseQueryResult<GetThreadResponse> => {
    return useQuery({
        queryKey: EMAIL_QUERY_KEYS.thread(emailId),
        queryFn: () => getThread(emailId),
        enabled: Boolean(emailId),
        retry: (failureCount, error) => {
            // Do not retry on 403 Forbidden or 404 Not Found
            const clientError = extractApiError(error);
            if (clientError.httpStatus === 403 || clientError.httpStatus === 404) {
                return false;
            }
            return failureCount < 2;
        },
        ...options,
    });
};
