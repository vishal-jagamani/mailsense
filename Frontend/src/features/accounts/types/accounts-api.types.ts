import { UseQueryOptions } from '@tanstack/react-query';
import { connectAccount } from '../api/accounts.api';

type ConnectAccountResult = Awaited<ReturnType<typeof connectAccount>>;

export type UseGetAccountDetailsQueryOptions = Omit<
    UseQueryOptions<ConnectAccountResult, Error, ConnectAccountResult, [string, string]>,
    'queryKey' | 'queryFn'
>;
