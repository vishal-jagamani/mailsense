import { axiosClient } from '@/shared/config/axios';
import { UpdateAPIResponse } from '@/shared/types/api.types';
import { FetchEmailRequestOptions, GetEmailsResponse } from '@/shared/types/email.types';
import { HOME_API_ENDPOINTS } from '../constants/api.constants';

export async function fetchEmails(body: FetchEmailRequestOptions) {
    const { data } = await axiosClient.post<GetEmailsResponse>(HOME_API_ENDPOINTS.EMAILS_LIST, body);
    return data;
}

export async function deleteEmail(emailIds: string[], trash: boolean) {
    const { data } = await axiosClient.delete<UpdateAPIResponse>(HOME_API_ENDPOINTS.EMAILS_DELETE, { data: { emailIds, trash } });
    return data;
}
