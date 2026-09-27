import { EmailAttributes, FetchEmailRequestOptions, GetFiltersResponse, PaginatedDataResponse, UpdateAPIResponse } from '@mailsense/types';
import { EMAIL_QUERY_KEYS } from '@shared/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteEmail, fetchEmails, getEmailFilters } from './inbox.api';

export const useFetchEmails = () => {
    return useMutation<PaginatedDataResponse<EmailAttributes>, Error, FetchEmailRequestOptions>({
        mutationFn: (options) => fetchEmails(options),
    });
};

export const useFetchEmailFilters = () => {
    return useQuery<GetFiltersResponse, Error>({
        queryKey: EMAIL_QUERY_KEYS.filters(),
        queryFn: () => getEmailFilters(),
    });
};

export const useDeleteEmail = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, { emailIds: string[]; trash: boolean }>({
        mutationFn: ({ emailIds, trash }) => deleteEmail(emailIds, trash),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EMAIL_QUERY_KEYS.all });
        },
        onError: (error: Error) => {
            toast.error('Could not delete email. Please retry in some time.', {
                description: error.message || 'Server error encountered. Please check your connection and try again.',
            });
        },
    });
};
