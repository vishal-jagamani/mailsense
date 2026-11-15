import { EmailAttributes, PaginatedDataResponse } from '@mailsense/types';
import { EMAIL_QUERY_KEYS } from '@shared/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchEmailPayload } from '../types';
import { getEmailDetails } from './inbox.api';

export const useSearchEmails = () => {
    const queryClient = useQueryClient();
    return useMutation<PaginatedDataResponse<EmailAttributes>, Error, SearchEmailPayload>({
        mutationFn: ({ searchText, userId }) => getEmailDetails(searchText, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EMAIL_QUERY_KEYS.all });
        },
    });
};
