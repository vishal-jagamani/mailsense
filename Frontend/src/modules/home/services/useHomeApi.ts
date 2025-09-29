import { EMAILS } from '@/shared/config/query-keys';
import { useQuery } from '@tanstack/react-query';
import { fetchEmails } from './home.api';
import { GetEmailsResponse } from '@/shared/types/email.types';

export const useFetchEmails = () => {
    return useQuery<GetEmailsResponse>({ queryKey: [EMAILS], queryFn: fetchEmails, staleTime: 1000 * 60 * 5 });
};
