import { axiosClient } from '@shared/api';

export const handleDownload = async (
    emailId: string,
    attId: string,
    filename: string,
    setLoadingAttId: React.Dispatch<React.SetStateAction<string | null>>,
) => {
    try {
        setLoadingAttId(attId);
        const response = await axiosClient.get(`/emails/attachment/${emailId}/${attId}`, {
            responseType: 'blob',
        });
        const contentType = (response.headers['content-type'] as string) || 'application/octet-stream';
        const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Error downloading attachment:', err);
    } finally {
        setLoadingAttId(null);
    }
};

export const handlePreview = async (
    emailId: string,
    attId: string,
    setLoadingAttId: React.Dispatch<React.SetStateAction<string | null>>,
    setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>,
) => {
    try {
        setLoadingAttId(attId);
        const response = await axiosClient.get(`/emails/attachment/${emailId}/${attId}`, {
            responseType: 'blob',
        });
        const contentType = (response.headers['content-type'] as string) || 'application/octet-stream';
        const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
        setPreviewUrl(url);
    } catch (err) {
        console.error('Error previewing attachment:', err);
    } finally {
        setLoadingAttId(null);
    }
};
