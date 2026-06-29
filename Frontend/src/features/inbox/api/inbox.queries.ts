import { Email, FetchEmailRequestOptions, GetFiltersResponse } from '@entities/email';
import { EMAIL_FILTERS } from '@shared/api';
import { PaginatedDataResponse, UpdateAPIResponse } from '@shared/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { deleteEmail, fetchEmails, getEmailFilters } from './inbox.api';

export const useFetchEmails = () => {
    return useMutation<PaginatedDataResponse<Email>, Error, FetchEmailRequestOptions>({ mutationFn: (options) => fetchEmails(options) });
};

export const useFetchEmailFilters = () => {
    return useQuery<GetFiltersResponse, Error>({ queryKey: [EMAIL_FILTERS], queryFn: () => getEmailFilters() });
};

export const useDeleteEmail = () => {
    return useMutation<UpdateAPIResponse, Error, { emailIds: string[]; trash: boolean }>({
        mutationFn: ({ emailIds, trash }) => deleteEmail(emailIds, trash),
    });
};
