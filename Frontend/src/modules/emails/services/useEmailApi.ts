import { ComposeEmailRequestBody, Email, SearchOtherContactsResponse } from '@entities/email';
import { EMAILS, QUERY_KEYS } from '@shared/api';
import { APIResponse, UpdateAPIResponse } from '@shared/types';
import { useMutation, useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { composeEmail, getEmailDetails, searchOtherContacts, starEmail, unreadEmail } from './email.api';

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
    return useMutation<UpdateAPIResponse, Error, { emailIds: string[]; unread: boolean }>({
        mutationFn: ({ emailIds, unread }) => unreadEmail(emailIds, unread),
    });
};

export const useComposeEmailMutation = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, ComposeEmailRequestBody>({
        mutationFn: (body) => composeEmail(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMAIL] });
            queryClient.invalidateQueries({ queryKey: [EMAILS] });
        },
    });
};

export const useSearchOtherContactsMutation = () => {
    return useMutation<APIResponse<SearchOtherContactsResponse[]>, Error, string>({
        mutationFn: (searchText) => searchOtherContacts(searchText),
    });
};
