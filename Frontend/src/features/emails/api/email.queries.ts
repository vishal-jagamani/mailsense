import { EmailAttributes, GetThreadResponse } from '@mailsense/types';
import { EMAIL_QUERY_KEYS } from '@shared/api';
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { getEmailDetails, getThread } from './email.api';

type UseGetEmailDetailsQueryOptions = Omit<UseQueryOptions<EmailAttributes, Error>, 'queryKey' | 'queryFn'>;
type UseGetThreadQueryOptions = Omit<UseQueryOptions<GetThreadResponse, Error>, 'queryKey' | 'queryFn'>;

export const useGetEmailDetailsQuery = (emailId: string, options?: UseGetEmailDetailsQueryOptions): UseQueryResult<EmailAttributes> => {
    return useQuery<EmailAttributes, Error>({
        queryKey: EMAIL_QUERY_KEYS.detail(emailId),
        queryFn: () => getEmailDetails(emailId),
        ...options,
    });
};

export const useGetThreadQuery = (emailId: string, options?: UseGetThreadQueryOptions): UseQueryResult<GetThreadResponse> => {
    return useQuery<GetThreadResponse, Error>({
        queryKey: EMAIL_QUERY_KEYS.thread(emailId),
        queryFn: () => getThread(emailId),
        ...options,
    });
};
