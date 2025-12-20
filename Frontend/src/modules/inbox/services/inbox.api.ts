import { axiosClient } from '@/shared/config/axios';
import { InboxSearchResultResponse } from '@/shared/types/inbox.types';

export async function getEmailDetails(searchText: string, userId: string): Promise<InboxSearchResultResponse> {
    const { data } = await axiosClient.post(`/emails/search`, { searchText }, { headers: { userid: userId } });
    return data;
}
