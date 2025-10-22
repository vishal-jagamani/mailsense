import { axiosClient } from '@/shared/config/axios';
import { GetEmailsResponse } from '@/shared/types/email.types';

export async function fetchEmails(userId: string) {
    const { data } = await axiosClient.get<GetEmailsResponse>(`/emails/list-all`, { headers: { userid: userId } });
    return data;
}

export async function deleteEmail(emailIds: string[], trash: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await axiosClient.delete<any, any>('/emails', { data: { emailIds, trash } });
    return data;
}
