import { QUERY_KEYS } from '@/shared/config/query-keys';
import { Email } from '@/shared/types/email.types';
import { useMutation, useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { archiveEmail, getEmailDetails } from './email.api';
import { UpdateAPIResponse } from '@/shared/types/api.types';

type UseGetEmailDetailsQueryOptions = Omit<UseQueryOptions<Email, Error>, 'queryKey' | 'queryFn'>;

export const useGetEmailDetailsQuery = (emailId: string, options?: UseGetEmailDetailsQueryOptions): UseQueryResult<Email> => {
    return useQuery<Email, Error>({
        queryKey: [QUERY_KEYS.EMAIL, emailId],
        queryFn: () => getEmailDetails(emailId),
        ...options,
    });
};

export const useArchiveEmailMutation = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, { emailIds: string[]; archive: boolean }>({
        mutationFn: ({ emailIds, archive }) => archiveEmail(emailIds, archive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMAIL] });
        },
    });
};
