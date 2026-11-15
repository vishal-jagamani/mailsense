import { useDeleteDraftMutation } from '@features/drafts/api/draft.mutations';
import { useGetDraftByIdQuery } from '@features/drafts/api/draft.queries';
import { useAutoSaveDraft } from '@features/drafts/hooks';
import { UseComposeEmailDraftActions } from '@features/emails/types/email-hooks.types';
import { trackUserAction } from '@shared/monitoring';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export const useComposeEmailDraftActions = (params: UseComposeEmailDraftActions) => {
    const { activeDraftId, isOpen, closeCompose, composeEmailBody, setComposeEmailBody, setStagedAttachments, setToEmailSearchText } = params;

    // Auto-save debounced hook
    const {
        draftId,
        isSaving: isSavingDraft,
        lastSavedAt,
    } = useAutoSaveDraft({
        composeBody: composeEmailBody,
        isOpen,
        activeDraftId,
    });

    // Query draft content if opening an existing draft
    const { data: existingDraftData, isLoading: isDraftLoading } = useGetDraftByIdQuery(activeDraftId || '', Boolean(activeDraftId && isOpen));
    const { mutate: deleteDraft } = useDeleteDraftMutation();

    const handleClose = useCallback(() => {
        closeCompose();
        setComposeEmailBody({ accountId: '', to: [], subject: '', body: '' });
        setStagedAttachments([]);
        setToEmailSearchText('');
    }, [closeCompose]);

    const handleDiscardDraft = useCallback(() => {
        try {
            const currentDraftId = draftId || activeDraftId;
            if (currentDraftId) {
                deleteDraft(currentDraftId, {
                    onSuccess: () => toast.success('Draft discarded'),
                    onError: () => toast.error('Failed to discard draft'),
                });
            }
            handleClose();
        } catch (error) {
            trackUserAction('ui.click', `Error discarding draft: ${error}`, 'warn');
            handleClose();
        }
    }, [draftId, activeDraftId, deleteDraft, handleClose]);

    // Populate compose form when existing draft is loaded
    useEffect(() => {
        if (existingDraftData && isOpen) {
            setComposeEmailBody({
                accountId: existingDraftData.accountId,
                to: existingDraftData.to || [],
                subject: existingDraftData.subject || '',
                body: existingDraftData.body || '',
            });

            if (existingDraftData.attachments && existingDraftData.attachments.length > 0) {
                setStagedAttachments(
                    existingDraftData.attachments.map((att) => ({
                        _id: att.attachmentId,
                        attachmentId: att.attachmentId,
                        filename: att.filename,
                        mimeType: att.mimeType,
                        size: att.size,
                        createdAt: new Date(),
                    })),
                );
            }
        }
    }, [existingDraftData, isOpen]);

    return { draftId, isDraftLoading, handleDiscardDraft, handleClose, isSavingDraft, lastSavedAt };
};
