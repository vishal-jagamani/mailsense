import { EmailAttributes, FetchEmailRequestOptions, GetFiltersResponse, PaginatedDataResponse, UpdateAPIResponse } from '@mailsense/types';
import { EMAIL_FILTERS } from '@shared/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { deleteEmail, fetchEmails, getEmailFilters } from './inbox.api';

export const useFetchEmails = () => {
    return useMutation<PaginatedDataResponse<EmailAttributes>, Error, FetchEmailRequestOptions>({ mutationFn: (options) => fetchEmails(options) });
};

export const useFetchEmailFilters = () => {
    return useQuery<GetFiltersResponse, Error>({ queryKey: [EMAIL_FILTERS], queryFn: () => getEmailFilters() });
};

export const useDeleteEmail = () => {
    return useMutation<UpdateAPIResponse, Error, { emailIds: string[]; trash: boolean }>({
        mutationFn: ({ emailIds, trash }) => deleteEmail(emailIds, trash),
    });
};
