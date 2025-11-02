import { QUERY_KEYS } from '@/shared/config/query-keys';
import { Email } from '@/shared/types/email.types';
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { getEmailDetails } from './email.api';

type UseGetEmailDetailsQueryOptions = Omit<UseQueryOptions<Email, Error>, 'queryKey' | 'queryFn'>;

export const useGetEmailDetailsQuery = (emailId: string, options?: UseGetEmailDetailsQueryOptions): UseQueryResult<Email> => {
    return useQuery<Email, Error>({
        queryKey: [QUERY_KEYS.EMAIL, emailId],
        queryFn: () => getEmailDetails(emailId),
        ...options,
    });
};
