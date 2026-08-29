import {
    APIResponse,
    ComposeEmailRequestBody,
    EmailAttributes,
    GetThreadResponse,
    MoveEmailsRequestBody,
    MoveEmailsResponse,
    SearchOtherContactsResponse,
    UpdateAPIResponse,
} from '@mailsense/types';
import { axiosClient, EMAILS_API_ENDPOINTS } from '@shared/api';

export async function getEmailDetails(emailId: string): Promise<EmailAttributes> {
    const { data } = await axiosClient.get(EMAILS_API_ENDPOINTS.DETAILS(emailId));
    return data;
}

export async function getThread(emailId: string): Promise<GetThreadResponse> {
    const { data } = await axiosClient.get(EMAILS_API_ENDPOINTS.THREAD(emailId));
    return data;
}

export async function starEmail(emailIds: string[], star: boolean): Promise<UpdateAPIResponse> {
    const { data } = await axiosClient.post(EMAILS_API_ENDPOINTS.STAR, { emailIds, star });
    return data;
}

export async function unreadEmail(emailIds: string[], unread: boolean): Promise<UpdateAPIResponse> {
    const { data } = await axiosClient.post(EMAILS_API_ENDPOINTS.UNREAD, { emailIds, unread });
    return data;
}

export async function composeEmail(body: ComposeEmailRequestBody): Promise<UpdateAPIResponse> {
    const { data } = await axiosClient.post(EMAILS_API_ENDPOINTS.COMPOSE, body);
    return data;
}

export async function searchOtherContacts(searchText: string): Promise<APIResponse<SearchOtherContactsResponse[]>> {
    const { data } = await axiosClient.post(EMAILS_API_ENDPOINTS.SEARCH_OTHER_CONTACTS, { searchText });
    return data;
}

export async function moveEmails(body: MoveEmailsRequestBody): Promise<MoveEmailsResponse> {
    const { data } = await axiosClient.post<MoveEmailsResponse>(EMAILS_API_ENDPOINTS.MOVE, body);
    return data;
}
