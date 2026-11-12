import { useEffect, useState } from 'react';

import { useGetAccountsQuery } from '@features/accounts/api/accounts.queries';
import { ComposeEmailRequestBody, UploadAttachmentResponse } from '@mailsense/types';
import { UseDebounceQuery } from '@shared/hooks';
import { useAuthStore, useComposeEmailPopupStore } from '@shared/store';
import { useSearchOtherContactsMutation } from '../../api/email.mutations';
import { useComposeEmailActions } from './useComposeEmailActions';
import { useComposeEmailAttachments } from './useComposeEmailAttachments';
import { useComposeEmailDraftActions } from './useComposeEmailDraftActions';

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

    useEffect(() => {
        const q = debouncedToEmailSearchText?.trim() ?? '';
        if (q.length > 2) {
            searchOtherContacts(q);
        }
    }, [debouncedToEmailSearchText, searchOtherContacts]);

    // Draft actions
    const { draftId, isDraftLoading, handleDiscardDraft, handleClose, isSavingDraft, lastSavedAt } = useComposeEmailDraftActions({
        activeDraftId,
        isOpen,
        closeCompose,
        composeEmailBody,
        setComposeEmailBody,
        setStagedAttachments,
        setToEmailSearchText,
    });

    // Attachment handling
    const { handleFileUpload, handleRemoveStagedAttachment } = useComposeEmailAttachments({
        accounts,
        composeEmailBody,
        setComposeEmailBody,
        setStagedAttachments,
        setIsUploadingAttachment,
    });

    // Compose email actions
    const {
        composeEmail: { loading: composeEmailLoading },
        sendEmail,
    } = useComposeEmailActions({
        accounts,
        stagedAttachments,
        draftId,
        activeDraftId,
        composeEmailBody,
        handleClose,
        setComposeEmailBody,
    });

    return {
        accounts: { data: accounts },
        searchOtherContacts: { data: searchOtherContactsData },
        composeEmail: { isLoading: composeEmailLoading || isDraftLoading },
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
