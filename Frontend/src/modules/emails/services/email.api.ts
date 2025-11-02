import { Email } from '@/shared/types/email.types';
import { axiosClient } from '@shared/config/axios';

export async function getEmailDetails(emailId: string): Promise<Email> {
    const { data } = await axiosClient.get(`/emails/details/${emailId}`);
    return data;
}
