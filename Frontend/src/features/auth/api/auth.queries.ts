import { QUERY_KEYS } from '@shared/api';
import { useQuery } from '@tanstack/react-query';
import { fetchUserProfile } from './auth.api';

export const useAuthQuery = () => {
    return useQuery({ queryKey: [QUERY_KEYS.AUTH], queryFn: fetchUserProfile, staleTime: 1000 * 60 * 5 });
};
