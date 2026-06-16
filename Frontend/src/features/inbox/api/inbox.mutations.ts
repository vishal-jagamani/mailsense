import { Email } from '@entities/email';
import { EMAILS } from '@shared/api';
import { PaginatedDataResponse } from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmailDetails } from './inbox.api';

export const useSearchEmails = () => {
    const queryClient = useQueryClient();
    return useMutation<PaginatedDataResponse<Email>, Error, { searchText: string; userId: string }>({
        mutationFn: ({ searchText, userId }) => getEmailDetails(searchText, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EMAILS] });
        },
    });
};
