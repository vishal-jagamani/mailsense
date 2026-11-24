import { APIResponse, GetEmailSummaryResponse, GetSuggestedRepliesResponse } from '@mailsense/types';
import { AI_API_ENDPOINTS, axiosClient } from '@shared/api';

export async function fetchEmailThreadSummary(emailId: string): Promise<GetEmailSummaryResponse> {
    const response = await axiosClient.get<APIResponse<GetEmailSummaryResponse>>(AI_API_ENDPOINTS.SUMMARY(emailId));
    return response.data.data;
}

export async function fetchSuggestedReplies(emailId: string): Promise<GetSuggestedRepliesResponse> {
    const response = await axiosClient.get<APIResponse<GetSuggestedRepliesResponse>>(AI_API_ENDPOINTS.SUGGESTIONS(emailId));
    return response.data.data;
}
