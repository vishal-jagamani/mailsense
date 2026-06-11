import { FetchEmailRequestOptions, GetEmailsResponse, InboxSearchResultResponse } from '@entities/email';
import { axiosClient, EMAILS_API_ENDPOINTS } from '@shared/api';
import { UpdateAPIResponse } from '@shared/types';

export async function fetchEmails(body: FetchEmailRequestOptions) {
    const { data } = await axiosClient.post<GetEmailsResponse>(EMAILS_API_ENDPOINTS.LIST, body);
    return data;
}

export async function deleteEmail(emailIds: string[], trash: boolean) {
    const { data } = await axiosClient.post<UpdateAPIResponse>(EMAILS_API_ENDPOINTS.DELETE, { emailIds, trash });
    return data;
}

export async function getEmailDetails(searchText: string, userId: string): Promise<InboxSearchResultResponse> {
    const { data } = await axiosClient.post(EMAILS_API_ENDPOINTS.SEARCH, { searchText }, { headers: { userid: userId } });
    return data;
}
