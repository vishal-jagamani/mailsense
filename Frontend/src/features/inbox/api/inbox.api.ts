import { EmailAttributes, FetchEmailRequestOptions, GetFiltersResponse, PaginatedDataResponse, UpdateAPIResponse } from '@mailsense/types';
import { axiosClient, EMAILS_API_ENDPOINTS } from '@shared/api';

export async function fetchEmails(body: FetchEmailRequestOptions) {
    const { data } = await axiosClient.post<PaginatedDataResponse<EmailAttributes>>(EMAILS_API_ENDPOINTS.LIST, body);
    return data;
}

export async function getEmailFilters() {
    const { data } = await axiosClient.get<GetFiltersResponse>(EMAILS_API_ENDPOINTS.FILTERS);
    return data;
}
export async function deleteEmail(emailIds: string[], trash: boolean) {
    const { data } = await axiosClient.post<UpdateAPIResponse>(EMAILS_API_ENDPOINTS.DELETE, { emailIds, trash });
    return data;
}

export async function getEmailDetails(searchText: string, userId: string): Promise<PaginatedDataResponse<EmailAttributes>> {
    const { data } = await axiosClient.post(EMAILS_API_ENDPOINTS.SEARCH, { searchText }, { headers: { userid: userId } });
    return data;
}
