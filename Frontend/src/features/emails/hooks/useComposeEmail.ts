import { useCallback, useEffect, useState } from 'react';

import { useGetAccountsQuery } from '@features/accounts/api/accounts.queries';
import { ComposeEmailRequestBody, UploadAttachmentResponse } from '@mailsense/types';
import { MESSAGES, UI_CONSTANTS } from '@shared/constants';
import { UseDebounceQuery } from '@shared/hooks';
import { useAuthStore, useComposeEmailPopupStore } from '@shared/store';
import { toast } from 'sonner';
import { useComposeEmailMutation, useSearchOtherContactsMutation } from '../api/email.mutations';
import { axiosClient } from '@shared/api';

export const useComposeEmail = () => {
    const user = useAuthStore((state) => state.user);
    const { isOpen, closeCompose } = useComposeEmailPopupStore();

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
        if (accounts && accounts.length > 0 && !composeEmailBody.accountId) {
            setComposeEmailBody((prev) => ({ ...prev, accountId: accounts[0]._id }));
        }
    }, [accounts, composeEmailBody.accountId]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        try {
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
            event.target.value = ''; // reset file input
        }
    };

    const handleRemoveStagedAttachment = async (attachmentId: string) => {
        try {
            await axiosClient.delete(`/attachments/${attachmentId}`);
            setStagedAttachments((prev) => prev.filter((att) => att.attachmentId !== attachmentId));
        } catch (err) {
            setStagedAttachments((prev) => prev.filter((att) => att.attachmentId !== attachmentId));
        }
    };

    const sendEmail = async () => {
        composeEmail({
            accountId: composeEmailBody.accountId,
            to: composeEmailBody.to,
            subject: composeEmailBody.subject,
            body: composeEmailBody.body,
            attachmentIds: stagedAttachments.map((att) => att.attachmentId),
        });
    };

    return {
        accounts: { data: accounts },
        searchOtherContacts: { data: searchOtherContactsData },
        composeEmail: { isLoading: composeEmailLoading },
        action: { handleClose, sendEmail, handleFileUpload, handleRemoveStagedAttachment },
        states: {
            isOpen,
            isToFocused,
            composeEmailBody,
            toEmailSearchText,
            debouncedToEmailSearchText,
            stagedAttachments,
            isUploadingAttachment,
        },
        setter: { setIsToFocused, setComposeEmailBody, setToEmailSearchText },
    };
};
