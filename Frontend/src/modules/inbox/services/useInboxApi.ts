import { InboxSearchResultResponse } from '@entities/email';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EMAILS } from '../../../shared/api/query-keys';
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
