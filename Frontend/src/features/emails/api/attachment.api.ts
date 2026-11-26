import { DeleteStagedAttachmentResponse, UploadAttachmentResponse } from '@mailsense/types';
import { axiosClient } from '@shared/api';

export async function uploadStagedAttachment(formData: FormData): Promise<UploadAttachmentResponse> {
    const response = await axiosClient.post<UploadAttachmentResponse>('/attachments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}

export async function deleteStagedAttachment(attachmentId: string): Promise<DeleteStagedAttachmentResponse> {
    const response = await axiosClient.delete<DeleteStagedAttachmentResponse>(`/attachments/${attachmentId}`);
    return response.data;
}
