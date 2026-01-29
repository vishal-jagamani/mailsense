import { axiosClient } from '@/shared/config/axios';
import { UpdateAPIResponse } from '@/shared/types/api.types';
import { FetchEmailRequestOptions, GetEmailsResponse } from '@/shared/types/email.types';

export async function fetchEmails(userId: string, options: FetchEmailRequestOptions) {
    const { data } = await axiosClient.get<GetEmailsResponse>(`/emails/list-all`, { headers: { userid: userId }, params: options });
    return data;
}

export async function fetchEmailsByAccount(accountId: string, options: FetchEmailRequestOptions) {
    const { data } = await axiosClient.get<GetEmailsResponse>(`/emails/list/${accountId}`, { params: options });
    return data;
}

export async function deleteEmail(emailIds: string[], trash: boolean) {
    const { data } = await axiosClient.delete<UpdateAPIResponse>('/emails', { data: { emailIds, trash } });
    return data;
}
