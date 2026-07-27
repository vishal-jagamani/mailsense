import { EmailAttributes } from '@mailsense/types';
import { QUERY_KEYS } from '@shared/api';
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { getEmailDetails } from './email.api';

type UseGetEmailDetailsQueryOptions = Omit<UseQueryOptions<EmailAttributes, Error>, 'queryKey' | 'queryFn'>;

export const useGetEmailDetailsQuery = (emailId: string, options?: UseGetEmailDetailsQueryOptions): UseQueryResult<EmailAttributes> => {
    return useQuery<EmailAttributes, Error>({
        queryKey: [QUERY_KEYS.EMAIL, emailId],
        queryFn: () => getEmailDetails(emailId),
        ...options,
    });
};
