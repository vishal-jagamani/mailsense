import { APIResponse, ComposeEmailRequestBody, SearchOtherContactsResponse, UpdateAPIResponse } from '@mailsense/types';
import { EMAIL_QUERY_KEYS } from '@shared/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { composeEmail, searchOtherContacts } from './email.api';

export const useComposeEmailMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<UpdateAPIResponse, Error, ComposeEmailRequestBody>({
        mutationFn: async (body: ComposeEmailRequestBody): Promise<UpdateAPIResponse> => await composeEmail(body),
        onSuccess: async (): Promise<void> => {
            await queryClient.invalidateQueries({ queryKey: EMAIL_QUERY_KEYS.all });
            toast.success('Email composed and sent successfully.');
        },
        onError: (error: Error): void => {
            toast.error('Failed to send email.', {
                description: error.message || 'Please verify recipient details and try again.',
            });
        },
    });
};

export const useSearchOtherContactsMutation = () => {
    return useMutation<APIResponse<SearchOtherContactsResponse[]>, Error, string>({
        mutationFn: async (searchText: string): Promise<APIResponse<SearchOtherContactsResponse[]>> => {
            return await searchOtherContacts(searchText);
        },
    });
};
