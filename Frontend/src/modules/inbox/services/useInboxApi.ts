import { EMAILS } from '@/shared/config/query-keys';
import { InboxSearchResultResponse } from '@/shared/types/inbox.types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmailDetails } from './inbox.api';

export const useSearchEmails = () => {
    const queryClient = useQueryClient();
    return useMutation<InboxSearchResultResponse, Error, { searchText: string; userId: string }>({
        mutationFn: ({ searchText, userId }) => getEmailDetails(searchText, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EMAILS] });
        },
    });
};
