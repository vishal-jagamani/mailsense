import { useQuery } from '@tanstack/react-query';
import { fetchUserProfile } from './auth.api';
import { QUERY_KEYS } from '@shared/config/query-keys';

export const useAuthQuery = () => {
    return useQuery({ queryKey: [QUERY_KEYS.AUTH], queryFn: fetchUserProfile, staleTime: 1000 * 60 * 5 });
};
