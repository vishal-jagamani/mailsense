import { useArchiveEmailMutation, useStarEmailMutation } from '@features/emails/api/email.mutations';
import { EmailAttributes } from '@mailsense/types';
import { toast } from 'sonner';
import { UseEmailStarArchiveActionsReturn, UseInboxEmailStarArchiveActionsParams } from '../../types/inbox.types';

export const useInboxEmailStarArchiveActions = (params: UseInboxEmailStarArchiveActionsParams): UseEmailStarArchiveActionsReturn => {
    const { emailIds, allEmails, handleActionSuccess, onRefetchEmails } = params;

    const { mutate: starEmailMutate, isPending: starEmailLoading } = useStarEmailMutation();

    const { mutate: archiveEmailMutate, isPending: archiveEmailLoading } = useArchiveEmailMutation();

    const handleStar = (): void => {
        if (emailIds.length === 0) return;
        const targetIds = [...emailIds];
        const targetEmails = allEmails ? allEmails.filter((item: EmailAttributes) => targetIds.includes(item._id)) : [];
        const allStarred =
            targetEmails.length > 0 &&
            targetEmails.every((item: EmailAttributes) => item.folders?.some((f: string) => f.toUpperCase() === 'STARRED'));
        const nextStar = !allStarred;

        starEmailMutate(
            { emailIds: targetIds, star: nextStar },
            {
                onSuccess: (res) => {
                    if (res && (!('status' in res) || res.status)) {
                        handleActionSuccess(
                            targetIds.length > 1
                                ? nextStar
                                    ? `${targetIds.length} emails starred`
                                    : `${targetIds.length} emails unstarred`
                                : nextStar
                                  ? 'Email starred'
                                  : 'Email unstarred',
                        );
                    } else {
                        toast.error('Failed to update star status. Please retry in some time.', { duration: 4000 });
                        onRefetchEmails();
                    }
                },
                onError: () => onRefetchEmails(),
            },
        );
    };

    const handleArchive = (): void => {
        if (emailIds.length === 0) return;
        const targetIds = [...emailIds];

        archiveEmailMutate(
            { emailIds: targetIds, archive: true },
            {
                onSuccess: (res) => {
                    if (res && res.status) {
                        handleActionSuccess(
                            targetIds.length > 1 ? `${targetIds.length} emails archived successfully` : 'Email archived successfully',
                        );
                    } else {
                        toast.error('Failed to archive email. Please retry in some time.', { duration: 4000 });
                        onRefetchEmails();
                    }
                },
                onError: () => onRefetchEmails(),
            },
        );
    };

    return {
        starAction: { handleStar, starEmailLoading },
        archiveAction: { handleArchive, archiveEmailLoading },
    };
};
