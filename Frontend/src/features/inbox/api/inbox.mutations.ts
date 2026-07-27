import { EmailAttributes, PaginatedDataResponse } from '@mailsense/types';
import { EMAILS } from '@shared/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmailDetails } from './inbox.api';

export const useSearchEmails = () => {
    const queryClient = useQueryClient();
    return useMutation<PaginatedDataResponse<EmailAttributes>, Error, { searchText: string; userId: string }>({
        mutationFn: ({ searchText, userId }) => getEmailDetails(searchText, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EMAILS] });
        },
    });
};
