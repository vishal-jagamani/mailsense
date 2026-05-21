import { axiosClient } from '@shared/config/axios';
import { APIResponse, ComposeEmailRequestBody, Email, SearchOtherContactsResponse, UpdateAPIResponse } from '@shared/types';
import { EMAIL_API_URLS } from '../constants/api.constants';

export async function getEmailDetails(emailId: string): Promise<Email> {
    const { data } = await axiosClient.get(EMAIL_API_URLS.DETAILS(emailId));
    return data;
}

export async function starEmail(emailIds: string[], star: boolean): Promise<UpdateAPIResponse> {
    const { data } = await axiosClient.post(EMAIL_API_URLS.STAR, { emailIds, star });
    return data;
}

export async function unreadEmail(emailIds: string[], unread: boolean): Promise<UpdateAPIResponse> {
    const { data } = await axiosClient.post(EMAIL_API_URLS.UNREAD, { emailIds, unread });
    return data;
}

export async function composeEmail(body: ComposeEmailRequestBody): Promise<UpdateAPIResponse> {
    const { data } = await axiosClient.post(EMAIL_API_URLS.COMPOSE, body);
    return data;
}

export async function searchOtherContacts(searchText: string): Promise<APIResponse<SearchOtherContactsResponse[]>> {
    const { data } = await axiosClient.post(EMAIL_API_URLS.SEARCH_OTHER_CONTACTS, { searchText });
    return data;
}
