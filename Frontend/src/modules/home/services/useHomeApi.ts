import { FetchEmailRequestOptions, GetEmailsResponse } from '@entities/email';
import { UpdateAPIResponse } from '@shared/types';
import { useMutation } from '@tanstack/react-query';
import { deleteEmail, fetchEmails } from './home.api';

export const useFetchEmails = () => {
    return useMutation<GetEmailsResponse, Error, FetchEmailRequestOptions>({ mutationFn: (options) => fetchEmails(options) });
};

export const useDeleteEmail = () => {
    return useMutation<UpdateAPIResponse, Error, { emailIds: string[]; trash: boolean }>({
        mutationFn: ({ emailIds, trash }) => deleteEmail(emailIds, trash),
    });
};
