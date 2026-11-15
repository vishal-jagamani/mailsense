import { UseComposeEmailAttachmentsParams } from '@features/emails/types';
import { UploadAttachmentResponse } from '@mailsense/types';
import { axiosClient } from '@shared/api';
import { trackUserAction } from '@shared/monitoring';
import { toast } from 'sonner';

export const useComposeEmailAttachments = (params: UseComposeEmailAttachmentsParams) => {
    const { composeEmailBody, setComposeEmailBody, accounts, setStagedAttachments, setIsUploadingAttachment } = params;

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
                const attachmentId = attachmentData?.attachmentId || (attachmentData as unknown as Record<string, unknown>)?._id;

                if (attachmentData && attachmentId) {
                    setStagedAttachments((prev) => [
                        ...prev,
                        {
                            _id: String(attachmentId),
                            attachmentId: String(attachmentId),
                            filename: String(attachmentData.filename || 'attachment'),
                            mimeType: String(attachmentData.mimeType || 'application/octet-stream'),
                            size: Number(attachmentData.size || 0),
                            createdAt: (attachmentData.createdAt as Date) || new Date(),
                        },
                    ]);
                }
            }
        } catch (error) {
            toast.error('Failed to upload attachment');
            trackUserAction('ui.click', `Error upload attachment: ${error}`, 'warn');
        } finally {
            setIsUploadingAttachment(false);
            event.target.value = '';
        }
    };

    const handleRemoveStagedAttachment = async (attachmentId: string): Promise<void> => {
        await axiosClient.delete(`/attachments/${attachmentId}`);
        setStagedAttachments((prev) => prev.filter((att) => att.attachmentId !== attachmentId));
    };

    return { handleFileUpload, handleRemoveStagedAttachment };
};
