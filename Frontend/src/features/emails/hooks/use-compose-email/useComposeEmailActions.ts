import { useSendDraftMutation } from '@features/drafts/api/draft.mutations';
import { useComposeEmailMutation } from '@features/emails/api/email.mutations';
import { UseComposeEmailActionsParams } from '@features/emails/types/email-hooks.types';
import { MESSAGES, UI_CONSTANTS } from '@shared/constants';
import { trackUserAction } from '@shared/monitoring';
import { useEffect } from 'react';
import { toast } from 'sonner';

export const useComposeEmailActions = (params: UseComposeEmailActionsParams) => {
    const { accounts, stagedAttachments, draftId, activeDraftId, composeEmailBody, handleClose, setComposeEmailBody } = params;

    const { mutate: composeEmail, data: composeEmailData, isPending: composeEmailLoading, error: composeEmailError } = useComposeEmailMutation();
    const { mutate: sendDraft, isPending: sendDraftLoading } = useSendDraftMutation();

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
            trackUserAction('api.error', `Error sending email: ${error}`, 'error');
            toast.error(MESSAGES.EMAILS.SEND_EMAIL_ERROR, { duration: UI_CONSTANTS.TOAST.DURATION });
        }
    };

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

    return {
        composeEmail: { data: composeEmailData, loading: composeEmailLoading || sendDraftLoading },
        sendDraft,
        sendEmail,
    };
};
