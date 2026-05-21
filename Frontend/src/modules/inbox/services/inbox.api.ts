import { axiosClient } from '@shared/config/axios';
import { InboxSearchResultResponse } from '@shared/types';
import { INBOX_API_ENDPOINTS } from '../constants/api.constants';

export async function getEmailDetails(searchText: string, userId: string): Promise<InboxSearchResultResponse> {
    const { data } = await axiosClient.post(INBOX_API_ENDPOINTS.SEARCH, { searchText }, { headers: { userid: userId } });
    return data;
}
