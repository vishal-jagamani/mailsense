import { axiosClient } from '@/shared/config/axios';
import { GetEmailsResponse } from '@/shared/types/email.types';

export async function fetchEmails() {
    const { data } = await axiosClient.get<GetEmailsResponse>('/emails/list/68eba47a4d3d1354140b2b65');
    return data;
}

export async function deleteEmail(emailIds: string[], trash: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await axiosClient.delete<any, any>('/emails', { data: { emailIds, trash } });
    return data;
}
