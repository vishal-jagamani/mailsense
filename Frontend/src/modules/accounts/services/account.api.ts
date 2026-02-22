import { AccountAttributes, AccountProviders } from '@/shared/types/account.types';
import { axiosClient } from '@shared/config/axios';
import { ACCOUNTS_API_ENDPOINTS } from '../constants/api.constants';

export async function getAccountProvider(): Promise<AccountProviders[]> {
    const { data } = await axiosClient.get<AccountProviders[]>(ACCOUNTS_API_ENDPOINTS.PROVIDERS_LIST);
    return data;
}

export async function getAccountDetails(accountId: string): Promise<AccountAttributes> {
    const { data } = await axiosClient.get<AccountAttributes>(ACCOUNTS_API_ENDPOINTS.DETAILS(accountId));
    return data;
}

export async function getAccounts(userId: string) {
    const { data } = await axiosClient.get<AccountAttributes[]>(ACCOUNTS_API_ENDPOINTS.LIST_BY_USER(userId));
    return data;
}

export async function connectAccount(provider: string) {
    const { data } = await axiosClient.get(ACCOUNTS_API_ENDPOINTS.CONNECT(provider));
    return data;
}

export async function syncAccount(accountId: string) {
    const { data } = await axiosClient.get(ACCOUNTS_API_ENDPOINTS.SYNC(accountId));
    return data;
}

export async function syncAllAccounts(userId: string) {
    const { data } = await axiosClient.get(ACCOUNTS_API_ENDPOINTS.SYNC_ALL, {
        params: {
            userId,
        },
    });
    return data;
}

export async function removeAccount(accountId: string) {
    const { data } = await axiosClient.delete(ACCOUNTS_API_ENDPOINTS.DELETE(accountId));
    return data;
}
