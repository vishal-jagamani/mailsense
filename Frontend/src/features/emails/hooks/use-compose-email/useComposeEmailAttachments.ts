import { useDeleteStagedAttachmentMutation, useUploadStagedAttachmentMutation } from '@features/emails/api/attachment.mutations';
import { UseComposeEmailAttachmentsParams } from '@features/emails/types';
import { toast } from 'sonner';

export const useComposeEmailAttachments = (params: UseComposeEmailAttachmentsParams) => {
    const { composeEmailBody, setComposeEmailBody, accounts, setStagedAttachments, setIsUploadingAttachment } = params;
    const { mutateAsync: uploadAttachmentAsync } = useUploadStagedAttachmentMutation();
    const { mutate: deleteAttachment } = useDeleteStagedAttachmentMutation();

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
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
        const uploads = Array.from(files).map((file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('accountId', targetAccountId);
            return uploadAttachmentAsync(formData);
        });

        const results = await Promise.allSettled(uploads);
        for (const outcome of results) {
            if (outcome.status === 'fulfilled' && outcome.value.attachment) {
                const attachment = outcome.value.attachment;
                setStagedAttachments((prev) => [
                    ...prev,
                    {
                        _id: attachment._id || attachment.attachmentId,
                        attachmentId: attachment.attachmentId || attachment._id,
                        filename: attachment.filename || 'attachment',
                        mimeType: attachment.mimeType || 'application/octet-stream',
                        size: attachment.size || 0,
                        createdAt: attachment.createdAt || new Date(),
                    },
                ]);
            }
        }

        setIsUploadingAttachment(false);
        event.target.value = '';
    };

    const handleRemoveStagedAttachment = (attachmentId: string): void => {
        deleteAttachment(attachmentId, {
            onSuccess: () => {
                setStagedAttachments((prev) => prev.filter((att) => att.attachmentId !== attachmentId));
            },
        });
    };

    return { handleFileUpload, handleRemoveStagedAttachment };
};
