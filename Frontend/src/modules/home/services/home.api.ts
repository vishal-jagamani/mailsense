import { axiosClient } from '@/shared/config/axios';
import { UpdateAPIResponse } from '@/shared/types/api.types';
import { FetchEmailRequestOptions, GetEmailsResponse } from '@/shared/types/email.types';

export async function fetchEmails(body: FetchEmailRequestOptions) {
    const { data } = await axiosClient.post<GetEmailsResponse>(`/emails/list-all`, body);
    return data;
}

export async function deleteEmail(emailIds: string[], trash: boolean) {
    const { data } = await axiosClient.delete<UpdateAPIResponse>('/emails', { data: { emailIds, trash } });
    return data;
}
