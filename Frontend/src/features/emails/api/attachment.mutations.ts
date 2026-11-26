import { DeleteStagedAttachmentResponse, UploadAttachmentResponse } from '@mailsense/types';
import { trackUserAction } from '@shared/monitoring';
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteStagedAttachment, uploadStagedAttachment } from './attachment.api';

export const useUploadStagedAttachmentMutation = (): UseMutationResult<UploadAttachmentResponse, Error, FormData> => {
    return useMutation<UploadAttachmentResponse, Error, FormData>({
        mutationFn: (formData) => uploadStagedAttachment(formData),
        onError: (error) => {
            toast.error('Failed to upload attachment');
            trackUserAction('ui.click', `Error upload attachment: ${error.message}`, 'warn');
        },
    });
};

export const useDeleteStagedAttachmentMutation = (): UseMutationResult<DeleteStagedAttachmentResponse, Error, string> => {
    return useMutation<DeleteStagedAttachmentResponse, Error, string>({
        mutationFn: (attachmentId) => deleteStagedAttachment(attachmentId),
        onError: (error) => {
            toast.error('Failed to remove staged attachment');
            trackUserAction('ui.click', `Error removing attachment: ${error.message}`, 'warn');
        },
    });
};
