import { GetEmailSummaryResponse, GetSuggestedRepliesResponse } from '@mailsense/types';
import { AI_QUERY_KEYS } from '@shared/api';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { fetchEmailThreadSummary, fetchSuggestedReplies } from './ai.api';

export const useSummarizeThreadQuery = (emailId: string, options?: Partial<UseQueryOptions<GetEmailSummaryResponse, Error>>) => {
    return useQuery<GetEmailSummaryResponse, Error>({
        queryKey: AI_QUERY_KEYS.summary(emailId),
        queryFn: () => fetchEmailThreadSummary(emailId),
        enabled: Boolean(emailId),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        ...options,
    });
};

export const useSuggestedRepliesQuery = (emailId: string, options?: Partial<UseQueryOptions<GetSuggestedRepliesResponse, Error>>) => {
    return useQuery<GetSuggestedRepliesResponse, Error>({
        queryKey: AI_QUERY_KEYS.suggestions(emailId),
        queryFn: () => fetchSuggestedReplies(emailId),
        enabled: Boolean(emailId),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        ...options,
    });
};
