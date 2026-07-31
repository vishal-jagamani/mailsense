import { AccountProviders } from '@entities/account';
import { AccountAttributes } from '@mailsense/types';
import { ACCOUNTS_API_ENDPOINTS, axiosClient } from '@shared/api';

export async function getAccountProvider(): Promise<AccountProviders[]> {
    const { data } = await axiosClient.get<AccountProviders[]>(ACCOUNTS_API_ENDPOINTS.PROVIDERS_LIST);
    return data;
}

export async function getAccountDetails(accountId: string): Promise<AccountAttributes> {
    const { data } = await axiosClient.get<AccountAttributes>(ACCOUNTS_API_ENDPOINTS.DETAILS(accountId));
    return data;
}

export async function getAccounts() {
    const { data } = await axiosClient.get<AccountAttributes[]>(ACCOUNTS_API_ENDPOINTS.LIST_BY_USER);
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

export async function enableAccount(accountId: string, active: boolean) {
    const { data: response } = await axiosClient.patch(ACCOUNTS_API_ENDPOINTS.ENABLE(accountId), { active });
    return response;
}

export async function updateAccountSettings(accountId: string, settings: { syncEnabled?: boolean; syncInterval?: number; active?: boolean }) {
    const { data: response } = await axiosClient.patch(ACCOUNTS_API_ENDPOINTS.UPDATE_SETTINGS(accountId), settings);
    return response;
}
