import { useCallback, useEffect, useState } from 'react';

import { useGetAccountsQuery } from '@features/accounts/api/accounts.queries';
import { ComposeEmailRequestBody } from '@mailsense/types';
import { MESSAGES, UI_CONSTANTS } from '@shared/constants';
import { UseDebounceQuery } from '@shared/hooks';
import { useAuthStore, useComposeEmailPopupStore } from '@shared/store';
import { toast } from 'sonner';
import { useComposeEmailMutation, useSearchOtherContactsMutation } from '../api/email.mutations';

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
        setComposeEmailBody({
            accountId: '',
            to: [],
            subject: '',
            body: '',
        });
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

    const sendEmail = async () => {
        composeEmail({
            accountId: composeEmailBody.accountId,
            to: composeEmailBody.to,
            subject: composeEmailBody.subject,
            body: composeEmailBody.body,
        });
    };

    return {
        accounts: { data: accounts },
        searchOtherContacts: { data: searchOtherContactsData },
        composeEmail: { isLoading: composeEmailLoading },
        action: { handleClose, sendEmail },
        states: { isOpen, isToFocused, composeEmailBody, toEmailSearchText, debouncedToEmailSearchText },
        setter: { setIsToFocused, setComposeEmailBody, setToEmailSearchText },
    };
};
