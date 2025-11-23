import { UpdateAPIResponse } from '@/shared/types/api.types';
import { Email } from '@/shared/types/email.types';
import { axiosClient } from '@shared/config/axios';

export async function getEmailDetails(emailId: string): Promise<Email> {
    const { data } = await axiosClient.get(`/emails/details/${emailId}`);
    return data;
}

export async function archiveEmail(emailIds: string[], archive: boolean): Promise<UpdateAPIResponse> {
    const { data } = await axiosClient.post(`/emails/archive`, { emailIds, archive });
    return data;
}
