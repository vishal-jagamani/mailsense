import { useCallback, useEffect, useState } from 'react';

import { useGetAccountsQuery } from '@features/accounts/api/accounts.queries';
import { useGetDraftByIdQuery } from '@features/drafts/api/draft.queries';
import { useDeleteDraftMutation, useSendDraftMutation } from '@features/drafts/api/draft.mutations';
import { useAutoSaveDraft } from '@features/drafts/hooks/useAutoSaveDraft';
import { ComposeEmailRequestBody, UploadAttachmentResponse } from '@mailsense/types';
import { axiosClient } from '@shared/api';
import { MESSAGES, UI_CONSTANTS } from '@shared/constants';
import { UseDebounceQuery } from '@shared/hooks';
import { useAuthStore, useComposeEmailPopupStore } from '@shared/store';
import { toast } from 'sonner';
import { useComposeEmailMutation, useSearchOtherContactsMutation } from '../api/email.mutations';

export const useComposeEmail = () => {
    const user = useAuthStore((state) => state.user);
    const { isOpen, activeDraftId, closeCompose } = useComposeEmailPopupStore();

    const [isToFocused, setIsToFocused] = useState<boolean>(false);
    const [composeEmailBody, setComposeEmailBody] = useState<ComposeEmailRequestBody>({
        accountId: '',
        to: [],
        subject: '',
        body: '',
    });
    const [toEmailSearchText, setToEmailSearchText] = useState<string>('');
    const debouncedToEmailSearchText = UseDebounceQuery({ text: toEmailSearchText });
    const [stagedAttachments, setStagedAttachments] = useState<UploadAttachmentResponse['attachment'][]>([]);
    const [isUploadingAttachment, setIsUploadingAttachment] = useState<boolean>(false);

    const { data: accounts } = useGetAccountsQuery(user?.id ?? '');
    const { mutate: searchOtherContacts, data: searchOtherContactsData } = useSearchOtherContactsMutation();
    const { mutate: composeEmail, data: composeEmailData, isPending: composeEmailLoading, error: composeEmailError } = useComposeEmailMutation();
    const { mutate: sendDraft, isPending: sendDraftLoading } = useSendDraftMutation();
    const { mutate: deleteDraft } = useDeleteDraftMutation();

    // Query draft content if opening an existing draft
    const { data: existingDraftData, isLoading: isDraftLoading } = useGetDraftByIdQuery(activeDraftId || '', Boolean(activeDraftId && isOpen));

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

    useEffect(() => {
        const q = debouncedToEmailSearchText?.trim() ?? '';
        if (q.length > 2) {
            searchOtherContacts(q);
        }
    }, [debouncedToEmailSearchText, searchOtherContacts]);

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
            console.error('Error discarding draft', error);
            handleClose();
        }
    }, [draftId, activeDraftId, deleteDraft, handleClose]);

    useEffect(() => {
        if (composeEmailData) {
            toast.success(MESSAGES.EMAILS.SEND_EMAIL_SUCCESS, { duration: UI_CONSTANTS.TOAST.DURATION });
            handleClose();
        }
        if (composeEmailError) {
            toast.error(MESSAGES.EMAILS.SEND_EMAIL_ERROR, { duration: UI_CONSTANTS.TOAST.DURATION });
        }
    }, [composeEmailData, composeEmailError, handleClose]);

    useEffect(() => {
        if (accounts && accounts.length > 0 && !composeEmailBody.accountId && !activeDraftId) {
            setComposeEmailBody((prev) => ({ ...prev, accountId: accounts[0]._id }));
        }
    }, [accounts, composeEmailBody.accountId, activeDraftId]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        try {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            let targetAccountId = composeEmailBody.accountId;
            if (!targetAccountId && accounts && accounts.length > 0) {
                targetAccountId = accounts[0]._id;
                setComposeEmailBody((prev) => ({ ...prev, accountId: targetAccountId }));
            }

            if (!targetAccountId) {
                toast.error('Please select or connect an account first');
                event.target.value = '';
                return;
            }

            setIsUploadingAttachment(true);
            for (let i = 0; i < files.length; i++) {
                const formData = new FormData();
                formData.append('file', files[i]);
                formData.append('accountId', targetAccountId);

                const res = await axiosClient.post<UploadAttachmentResponse>('/attachments/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                const attachmentData = res.data?.attachment || (res.data as unknown as Record<string, unknown>);
                const attachmentId = attachmentData?.attachmentId || (attachmentData as Record<string, unknown>)?._id;

                if (attachmentData && attachmentId) {
                    setStagedAttachments((prev) => [
                        ...prev,
                        {
                            attachmentId: String(attachmentId),
                            filename: String(attachmentData.filename || 'attachment'),
                            mimeType: String(attachmentData.mimeType || 'application/octet-stream'),
                            size: Number(attachmentData.size || 0),
                            createdAt: (attachmentData.createdAt as Date) || new Date(),
                        },
                    ]);
                }
            }
        } catch (err) {
            toast.error('Failed to upload attachment');
        } finally {
            setIsUploadingAttachment(false);
            event.target.value = '';
        }
    };

    const handleRemoveStagedAttachment = async (attachmentId: string): Promise<void> => {
        try {
            await axiosClient.delete(`/attachments/${attachmentId}`);
            setStagedAttachments((prev) => prev.filter((att) => att.attachmentId !== attachmentId));
        } catch (err) {
            setStagedAttachments((prev) => prev.filter((att) => att.attachmentId !== attachmentId));
        }
    };

    const sendEmail = async (): Promise<void> => {
        try {
            const currentDraftId = draftId || activeDraftId;
            if (currentDraftId) {
                sendDraft(currentDraftId, {
                    onSuccess: () => {
                        toast.success(MESSAGES.EMAILS.SEND_EMAIL_SUCCESS, { duration: UI_CONSTANTS.TOAST.DURATION });
                        handleClose();
                    },
                    onError: () => {
                        toast.error(MESSAGES.EMAILS.SEND_EMAIL_ERROR, { duration: UI_CONSTANTS.TOAST.DURATION });
                    },
                });
            } else {
                composeEmail({
                    accountId: composeEmailBody.accountId,
                    to: composeEmailBody.to,
                    subject: composeEmailBody.subject,
                    body: composeEmailBody.body,
                    attachmentIds: stagedAttachments.map((att) => att.attachmentId),
                });
            }
        } catch (error) {
            console.error('Error sending email', error);
            toast.error(MESSAGES.EMAILS.SEND_EMAIL_ERROR, { duration: UI_CONSTANTS.TOAST.DURATION });
        }
    };

    return {
        accounts: { data: accounts },
        searchOtherContacts: { data: searchOtherContactsData },
        composeEmail: { isLoading: composeEmailLoading || sendDraftLoading || isDraftLoading },
        action: { handleClose, handleDiscardDraft, sendEmail, handleFileUpload, handleRemoveStagedAttachment },
        states: {
            isOpen,
            isToFocused,
            composeEmailBody,
            toEmailSearchText,
            debouncedToEmailSearchText,
            stagedAttachments,
            isUploadingAttachment,
            isSavingDraft,
            lastSavedAt,
            draftId: draftId || activeDraftId,
        },
        setter: { setIsToFocused, setComposeEmailBody, setToEmailSearchText },
    };
};
