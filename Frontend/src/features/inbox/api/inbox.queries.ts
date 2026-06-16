import { Email, FetchEmailRequestOptions } from '@entities/email';
import { PaginatedDataResponse, UpdateAPIResponse } from '@shared/types';
import { useMutation } from '@tanstack/react-query';
import { deleteEmail, fetchEmails } from './inbox.api';

export const useFetchEmails = () => {
    return useMutation<PaginatedDataResponse<Email>, Error, FetchEmailRequestOptions>({ mutationFn: (options) => fetchEmails(options) });
};

export const useDeleteEmail = () => {
    return useMutation<UpdateAPIResponse, Error, { emailIds: string[]; trash: boolean }>({
        mutationFn: ({ emailIds, trash }) => deleteEmail(emailIds, trash),
    });
};
