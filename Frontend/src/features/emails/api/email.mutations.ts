import {
    APIResponse,
    ComposeEmailRequestBody,
    MoveEmailsRequestBody,
    MoveEmailsResponse,
    SearchOtherContactsResponse,
    UpdateAPIResponse,
} from '@mailsense/types';
import { EMAILS, FOLDER_KEYS, QUERY_KEYS } from '@shared/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { composeEmail, moveEmails, searchOtherContacts, starEmail, unreadEmail } from './email.api';

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

export function useMoveEmailsMutation() {
    const queryClient = useQueryClient();

    return useMutation<MoveEmailsResponse, Error, MoveEmailsRequestBody>({
        mutationFn: (data: MoveEmailsRequestBody) => moveEmails(data),
        onSuccess: () => {
            // Invalidate inbox emails and folder queries
            queryClient.invalidateQueries({ queryKey: [EMAILS] });
            queryClient.invalidateQueries({ queryKey: [FOLDER_KEYS.FOLDERS] });
        },
    });
}
