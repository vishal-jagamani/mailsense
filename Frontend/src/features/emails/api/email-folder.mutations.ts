import { EmailAttributes, MoveEmailsRequestBody, MoveEmailsResponse, PaginatedDataResponse } from '@mailsense/types';
import { EMAIL_QUERY_KEYS, FOLDER_KEYS } from '@shared/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MoveEmailsMutationContext } from '../types';
import { moveEmails } from './email.api';

export const useMoveEmailsMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<MoveEmailsResponse, Error, MoveEmailsRequestBody, MoveEmailsMutationContext>({
        mutationFn: async (data: MoveEmailsRequestBody): Promise<MoveEmailsResponse> => await moveEmails(data),
        onMutate: async (variables: MoveEmailsRequestBody): Promise<MoveEmailsMutationContext> => {
            await queryClient.cancelQueries({ queryKey: EMAIL_QUERY_KEYS.all });
            const previousEmails = queryClient.getQueryData<PaginatedDataResponse<EmailAttributes>>(EMAIL_QUERY_KEYS.all);

            if (previousEmails && previousEmails.data) {
                const idSet = new Set(variables.emailIds);
                const updatedData = previousEmails.data.filter((email: EmailAttributes) => !idSet.has(email._id));
                queryClient.setQueryData<PaginatedDataResponse<EmailAttributes>>(EMAIL_QUERY_KEYS.all, {
                    ...previousEmails,
                    data: updatedData,
                    total: Math.max(0, previousEmails.total - idSet.size),
                });
            }

            return { previousEmails };
        },
        onError: (error: Error, _variables: MoveEmailsRequestBody, context: MoveEmailsMutationContext | undefined): void => {
            if (context?.previousEmails) {
                queryClient.setQueryData(EMAIL_QUERY_KEYS.all, context.previousEmails);
            }
            toast.error('Could not move emails to target folder. Please retry in some time.', {
                description: error.message || 'Server was unable to complete provider folder migration.',
            });
        },
        onSettled: async (): Promise<void> => {
            await queryClient.invalidateQueries({ queryKey: EMAIL_QUERY_KEYS.all });
            await queryClient.invalidateQueries({ queryKey: [FOLDER_KEYS.FOLDERS] });
        },
    });
};
