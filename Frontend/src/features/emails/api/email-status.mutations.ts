import { EmailAttributes, EmailStarParams, EmailUnreadParams, PaginatedDataResponse, UpdateAPIResponse } from '@mailsense/types';
import { EMAIL_QUERY_KEYS } from '@shared/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArchiveEmailMutationContext, ArchiveEmailMutationParams, StarEmailMutationContext, UnreadEmailMutationContext } from '../types';
import { archiveEmail, starEmail, unreadEmail } from './email.api';

export function useStarEmailMutation() {
    const queryClient = useQueryClient();

    return useMutation<UpdateAPIResponse, Error, EmailStarParams, StarEmailMutationContext>({
        mutationFn: async ({ emailIds, star }: EmailStarParams): Promise<UpdateAPIResponse> => await starEmail(emailIds, star),
        onMutate: async ({ emailIds, star }: EmailStarParams): Promise<StarEmailMutationContext> => {
            await queryClient.cancelQueries({ queryKey: EMAIL_QUERY_KEYS.all });
            const previousEmails = queryClient.getQueryData<PaginatedDataResponse<EmailAttributes>>(EMAIL_QUERY_KEYS.all);

            if (previousEmails && previousEmails.data) {
                const idSet = new Set(emailIds);
                const updatedData = previousEmails.data.map((email: EmailAttributes) => {
                    if (idSet.has(email._id)) {
                        const currentFolders = email.folders || [];
                        const updatedFolders = star
                            ? Array.from(new Set([...currentFolders, 'STARRED']))
                            : currentFolders.filter((f: string) => f.toUpperCase() !== 'STARRED' && f.toLowerCase() !== 'starred');
                        return { ...email, folders: updatedFolders };
                    }
                    return email;
                });
                queryClient.setQueryData<PaginatedDataResponse<EmailAttributes>>(EMAIL_QUERY_KEYS.all, {
                    ...previousEmails,
                    data: updatedData,
                });
            }

            return { previousEmails };
        },
        onError: (error: Error, variables: EmailStarParams, context: StarEmailMutationContext | undefined): void => {
            if (context?.previousEmails) {
                queryClient.setQueryData(EMAIL_QUERY_KEYS.all, context.previousEmails);
            }
            const actionLabel = variables.star ? 'star' : 'unstar';
            toast.error(`Could not ${actionLabel} email. Please retry in some time.`, {
                description: error.message || 'Server error encountered. Please check your connection and try again.',
            });
        },
    });
}

export const useUnreadEmailMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<UpdateAPIResponse, Error, EmailUnreadParams, UnreadEmailMutationContext>({
        mutationFn: async ({ emailIds, unread }: EmailUnreadParams): Promise<UpdateAPIResponse> => await unreadEmail(emailIds, unread),
        onMutate: async ({ emailIds, unread }: EmailUnreadParams): Promise<UnreadEmailMutationContext> => {
            await queryClient.cancelQueries({ queryKey: EMAIL_QUERY_KEYS.all });
            const previousEmails = queryClient.getQueryData<PaginatedDataResponse<EmailAttributes>>(EMAIL_QUERY_KEYS.all);

            if (previousEmails && previousEmails.data) {
                const idSet = new Set(emailIds);
                const updatedData = previousEmails.data.map((email: EmailAttributes) => {
                    if (idSet.has(email._id)) {
                        return { ...email, isRead: !unread };
                    }
                    return email;
                });
                queryClient.setQueryData<PaginatedDataResponse<EmailAttributes>>(EMAIL_QUERY_KEYS.all, {
                    ...previousEmails,
                    data: updatedData,
                });
            }

            return { previousEmails };
        },
        onError: (error: Error, variables: EmailUnreadParams, context: UnreadEmailMutationContext | undefined): void => {
            if (context?.previousEmails) {
                queryClient.setQueryData(EMAIL_QUERY_KEYS.all, context.previousEmails);
            }
            const actionLabel = variables.unread ? 'mark as unread' : 'mark as read';
            toast.error(`Could not ${actionLabel}. Please retry in some time.`, {
                description: error.message || 'Server error encountered. Please check your connection and try again.',
            });
        },
    });
};

export const useArchiveEmailMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<UpdateAPIResponse, Error, ArchiveEmailMutationParams, ArchiveEmailMutationContext>({
        mutationFn: async ({ emailIds, archive }: ArchiveEmailMutationParams): Promise<UpdateAPIResponse> => await archiveEmail(emailIds, archive),
        onMutate: async ({ emailIds }: ArchiveEmailMutationParams): Promise<ArchiveEmailMutationContext> => {
            await queryClient.cancelQueries({ queryKey: EMAIL_QUERY_KEYS.all });
            const previousEmails = queryClient.getQueryData<PaginatedDataResponse<EmailAttributes>>(EMAIL_QUERY_KEYS.all);

            if (previousEmails && previousEmails.data) {
                const idSet = new Set(emailIds);
                // Optimistically remove archived emails from list
                const updatedData = previousEmails.data.filter((email: EmailAttributes) => !idSet.has(email._id));
                queryClient.setQueryData<PaginatedDataResponse<EmailAttributes>>(EMAIL_QUERY_KEYS.all, {
                    ...previousEmails,
                    data: updatedData,
                    total: Math.max(0, previousEmails.total - idSet.size),
                });
            }

            return { previousEmails };
        },
        onError: (error: Error, _variables: ArchiveEmailMutationParams, context: ArchiveEmailMutationContext | undefined): void => {
            if (context?.previousEmails) {
                queryClient.setQueryData(EMAIL_QUERY_KEYS.all, context.previousEmails);
            }
            toast.error('Could not archive email. Please retry in some time.', {
                description: error.message || 'Server error encountered. Please check your connection and try again.',
            });
        },
        onSettled: async (): Promise<void> => await queryClient.invalidateQueries({ queryKey: EMAIL_QUERY_KEYS.all }),
    });
};
