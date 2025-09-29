import { axiosClient } from '@/shared/config/axios';
import { GetEmailsResponse } from '@/shared/types/email.types';

export async function fetchEmails() {
    const { data } = await axiosClient.get<GetEmailsResponse>('/emails/68d3717b151906ff9a7d9110');
    return data;
}
