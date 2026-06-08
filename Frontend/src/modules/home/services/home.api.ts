import { FetchEmailRequestOptions, GetEmailsResponse } from '@entities/email';
import { axiosClient } from '@shared/api';
import { UpdateAPIResponse } from '@shared/types';
import { HOME_API_ENDPOINTS } from '../constants/api.constants';

export async function fetchEmails(body: FetchEmailRequestOptions) {
    const { data } = await axiosClient.post<GetEmailsResponse>(HOME_API_ENDPOINTS.EMAILS_LIST, body);
    return data;
}

export async function deleteEmail(emailIds: string[], trash: boolean) {
    const { data } = await axiosClient.post<UpdateAPIResponse>(HOME_API_ENDPOINTS.EMAILS_DELETE, { emailIds, trash });
    return data;
}
