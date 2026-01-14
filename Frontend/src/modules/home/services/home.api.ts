import { axiosClient } from '@/shared/config/axios';
import { UpdateAPIResponse } from '@/shared/types/api.types';
import { GetEmailsResponse } from '@/shared/types/email.types';

export async function fetchEmails(userId: string) {
    const { data } = await axiosClient.get<GetEmailsResponse>(`/emails/list-all`, { headers: { userid: userId } });
    return data;
}

export async function fetchEmailsByAccount(accountId: string) {
    const { data } = await axiosClient.get<GetEmailsResponse>(`/emails/list/${accountId}`);
    return data;
}

export async function deleteEmail(emailIds: string[], trash: boolean) {
    const { data } = await axiosClient.delete<UpdateAPIResponse>('/emails', { data: { emailIds, trash } });
    return data;
}
