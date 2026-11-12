import { useArchiveEmailMutation, useStarEmailMutation } from '@features/emails/api/email.mutations';
import { UseEmailActionsOptions } from '@features/emails/types/email-ui.types';
import { EmailAttributes } from '@mailsense/types';
import { toast } from 'sonner';

export const useEmailStarArchiveActions = (params: UseEmailActionsOptions) => {
    const { emailsData, selectedEmails, setEmailsData, onRefresh, onClearSelection } = params;

    const { mutate: starEmailMutate, isPending: starEmailLoading } = useStarEmailMutation();
    const { mutate: archiveEmailMutate, isPending: archiveEmailLoading } = useArchiveEmailMutation();

    const handleStar = (email?: EmailAttributes): void => {
        const targetIds = selectedEmails.length > 0 ? [...selectedEmails] : email ? [email._id] : [];
        if (targetIds.length === 0) return;

        let nextStar = true;
        if (emailsData?.data) {
            const targetEmails = emailsData.data.filter((item) => targetIds.includes(item._id));
            const allStarred = targetEmails.length > 0 && targetEmails.every((item) => item.folders?.includes('STARRED'));
            nextStar = !allStarred;
        } else if (email) {
            nextStar = !email.folders?.includes('STARRED');
        }

        const previousData = emailsData;
        setEmailsData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                data: prev.data.map((item) => {
                    if (targetIds.includes(item._id)) {
                        const currentFolders = item.folders || [];
                        const updatedFolders = nextStar
                            ? Array.from(new Set([...currentFolders, 'STARRED']))
                            : currentFolders.filter((f) => f.toUpperCase() !== 'STARRED');
                        return { ...item, folders: updatedFolders };
                    }
                    return item;
                }),
            };
        });

        starEmailMutate(
            { emailIds: targetIds, star: nextStar },
            {
                onSuccess: (res) => {
                    if (res && (!('status' in res) || res.status)) {
                        const label =
                            targetIds.length > 1
                                ? nextStar
                                    ? `${targetIds.length} emails starred`
                                    : `${targetIds.length} emails unstarred`
                                : nextStar
                                  ? 'Email starred'
                                  : 'Email unstarred';
                        toast.success(label, { duration: 3000 });
                        onRefresh();
                    } else {
                        toast.error('Failed to update star status. Please retry in some time.', { duration: 4000 });
                        setEmailsData(previousData);
                        onRefresh();
                    }
                },
                onError: () => {
                    setEmailsData(previousData);
                    onRefresh();
                },
            },
        );
    };

    const handleArchive = (email?: EmailAttributes): void => {
        const targetIds = selectedEmails.length > 0 ? [...selectedEmails] : email ? [email._id] : [];
        if (targetIds.length === 0) return;

        const previousData = emailsData;
        setEmailsData((prev) => {
            if (!prev) return prev;
            return { ...prev, data: prev.data.filter((item) => !targetIds.includes(item._id)) };
        });

        archiveEmailMutate(
            { emailIds: targetIds, archive: true },
            {
                onSuccess: (res) => {
                    if (res && res.status) {
                        toast.success(targetIds.length > 1 ? `${targetIds.length} emails archived` : 'Email archived', { duration: 3000 });
                        onClearSelection?.();
                        onRefresh();
                    } else {
                        toast.error('Failed to archive email. Please retry in some time.', { duration: 4000 });
                        setEmailsData(previousData);
                        onRefresh();
                    }
                },
                onError: () => {
                    setEmailsData(previousData);
                    onRefresh();
                },
            },
        );
    };

    return {
        starEmail: { handleStar, starEmailLoading },
        archiveEmail: { handleArchive, archiveEmailLoading },
    };
};
