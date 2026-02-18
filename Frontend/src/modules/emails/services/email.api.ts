import { UpdateAPIResponse } from '@/shared/types/api.types';
import { Email } from '@/shared/types/email.types';
import { axiosClient } from '@shared/config/axios';
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
