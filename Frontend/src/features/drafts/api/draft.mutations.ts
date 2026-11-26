import { DraftAttributes, SaveDraftRequestBody, SuccessAPIResponse } from '@mailsense/types';
import { DRAFT_QUERY_KEYS, EMAIL_QUERY_KEYS } from '@shared/api';
import { trackUserAction } from '@shared/monitoring';
import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteDraft, saveDraft, sendDraft } from './draft.api';

export const useSaveDraftMutation = (): UseMutationResult<DraftAttributes, Error, SaveDraftRequestBody> => {
    const queryClient = useQueryClient();
    return useMutation<DraftAttributes, Error, SaveDraftRequestBody>({
        mutationFn: (payload) => saveDraft(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DRAFT_QUERY_KEYS.list() });
        },
    });
};

export const useDeleteDraftMutation = (): UseMutationResult<SuccessAPIResponse, Error, string> => {
    const queryClient = useQueryClient();
    return useMutation<SuccessAPIResponse, Error, string>({
        mutationFn: (draftId) => deleteDraft(draftId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DRAFT_QUERY_KEYS.all });
        },
        onError: (error) => {
            trackUserAction('ui.click', `Error deleting draft: ${error.message}`, 'error');
            toast.error('Error deleting draft');
        },
    });
};

export const useSendDraftMutation = (): UseMutationResult<SuccessAPIResponse, Error, string> => {
    const queryClient = useQueryClient();
    return useMutation<SuccessAPIResponse, Error, string>({
        mutationFn: (draftId) => sendDraft(draftId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DRAFT_QUERY_KEYS.all });
            queryClient.invalidateQueries({ queryKey: EMAIL_QUERY_KEYS.all });
        },
    });
};
