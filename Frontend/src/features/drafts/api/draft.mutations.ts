import { DraftAttributes, SaveDraftRequestBody, SuccessAPIResponse } from '@mailsense/types';
import { DRAFT_QUERY_KEYS, EMAILS } from '@shared/api';
import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
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
    });
};

export const useSendDraftMutation = (): UseMutationResult<SuccessAPIResponse, Error, string> => {
    const queryClient = useQueryClient();
    return useMutation<SuccessAPIResponse, Error, string>({
        mutationFn: (draftId) => sendDraft(draftId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DRAFT_QUERY_KEYS.all });
            queryClient.invalidateQueries({ queryKey: [EMAILS] });
        },
    });
};
