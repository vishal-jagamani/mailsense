import { EMAILS } from '@/shared/config/query-keys';
import { useMutation, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { deleteEmail, fetchEmails } from './home.api';
import { GetEmailsResponse } from '@/shared/types/email.types';

export const useFetchEmails = (userId: string, enabled: boolean) => {
    return useQuery<GetEmailsResponse>({ queryKey: [EMAILS], queryFn: () => fetchEmails(userId), staleTime: 1000 * 60 * 5, enabled });
};

export const useDeleteEmail = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return useMutation<any, any, { emailIds: string[]; trash: boolean }>({
        mutationFn: ({ emailIds, trash }) => deleteEmail(emailIds, trash),
    });
};
