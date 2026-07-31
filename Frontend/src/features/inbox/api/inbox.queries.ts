import { EmailAttributes, FetchEmailRequestOptions, GetFiltersResponse, PaginatedDataResponse, UpdateAPIResponse } from '@mailsense/types';
import { EMAIL_FILTERS, EMAILS } from '@shared/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteEmail, fetchEmails, getEmailFilters } from './inbox.api';

export const useFetchEmails = () => {
    return useMutation<PaginatedDataResponse<EmailAttributes>, Error, FetchEmailRequestOptions>({ mutationFn: (options) => fetchEmails(options) });
};

export const useFetchEmailFilters = () => {
    return useQuery<GetFiltersResponse, Error>({ queryKey: [EMAIL_FILTERS], queryFn: () => getEmailFilters() });
};

export const useDeleteEmail = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateAPIResponse, Error, { emailIds: string[]; trash: boolean }>({
        mutationFn: ({ emailIds, trash }) => deleteEmail(emailIds, trash),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [EMAILS] });
        },
    });
};
