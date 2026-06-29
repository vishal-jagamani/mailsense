import { Email, FetchEmailRequestOptions, GetFiltersResponse } from '@entities/email';
import { axiosClient, EMAILS_API_ENDPOINTS } from '@shared/api';
import { PaginatedDataResponse, UpdateAPIResponse } from '@shared/types';

export async function fetchEmails(body: FetchEmailRequestOptions) {
    const { data } = await axiosClient.post<PaginatedDataResponse<Email>>(EMAILS_API_ENDPOINTS.LIST, body);
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

export async function getEmailDetails(searchText: string, userId: string): Promise<PaginatedDataResponse<Email>> {
    const { data } = await axiosClient.post(EMAILS_API_ENDPOINTS.SEARCH, { searchText }, { headers: { userid: userId } });
    return data;
}
