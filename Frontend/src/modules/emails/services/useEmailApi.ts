import { QUERY_KEYS } from '@/shared/config/query-keys';
import { UpdateAPIResponse } from '@/shared/types/api.types';
import { Email } from '@/shared/types/email.types';
import { useMutation, useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { getEmailDetails, starEmail, unreadEmail } from './email.api';

type UseGetEmailDetailsQueryOptions = Omit<UseQueryOptions<Email, Error>, 'queryKey' | 'queryFn'>;

export const useGetEmailDetailsQuery = (emailId: string, options?: UseGetEmailDetailsQueryOptions): UseQueryResult<Email> => {
    return useQuery<Email, Error>({
        queryKey: [QUERY_KEYS.EMAIL, emailId],
        queryFn: () => getEmailDetails(emailId),
        ...options,
    });
};

export const useStarEmailMutation = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, { emailIds: string[]; star: boolean }>({
        mutationFn: ({ emailIds, star }) => starEmail(emailIds, star),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMAIL] });
        },
    });
};

export const useUnreadEmailMutation = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, { emailIds: string[]; unread: boolean }>({
        mutationFn: ({ emailIds, unread }) => unreadEmail(emailIds, unread),
        // onSuccess: () => {
        //     queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMAIL] });
        // },
    });
};
