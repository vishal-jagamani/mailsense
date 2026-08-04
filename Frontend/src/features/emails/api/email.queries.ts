import { EmailAttributes, GetThreadResponse } from '@mailsense/types';
import { QUERY_KEYS } from '@shared/api';
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { getEmailDetails, getThread } from './email.api';

type UseGetEmailDetailsQueryOptions = Omit<UseQueryOptions<EmailAttributes, Error>, 'queryKey' | 'queryFn'>;
type UseGetThreadQueryOptions = Omit<UseQueryOptions<GetThreadResponse, Error>, 'queryKey' | 'queryFn'>;

export const useGetEmailDetailsQuery = (emailId: string, options?: UseGetEmailDetailsQueryOptions): UseQueryResult<EmailAttributes> => {
    return useQuery<EmailAttributes, Error>({
        queryKey: [QUERY_KEYS.EMAIL, emailId],
        queryFn: () => getEmailDetails(emailId),
        ...options,
    });
};

export const useGetThreadQuery = (emailId: string, options?: UseGetThreadQueryOptions): UseQueryResult<GetThreadResponse> => {
    return useQuery<GetThreadResponse, Error>({
        queryKey: [QUERY_KEYS.EMAIL, 'thread', emailId],
        queryFn: () => getThread(emailId),
        ...options,
    });
};
