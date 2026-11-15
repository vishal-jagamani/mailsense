import { AccountProviderType, SanitizedAccountAttributes, UpdateAPIResponse } from '@mailsense/types';
import { UpdateAccountSettingsSchema } from '../schema/index.js';
import { OAuthCallbackParams, OAuthConnectResponse, SyncAccountJobResponse, SyncAccountsResponse } from '../types/index.js';
import { AccountOAuthService } from './account-oauth.service.js';
import { AccountsReadService } from './account-read.service.js';
import { AccountsWriteService } from './account-write.service.js';

export class AccountsService {
    constructor(
        private readonly accountsOAuthService: AccountOAuthService = new AccountOAuthService(),
        private readonly accountsReadService: AccountsReadService = new AccountsReadService(),
        private readonly accountsWriteService: AccountsWriteService = new AccountsWriteService(),
    ) {}

    //* Account Oauth Methods
    //*==========================================
    async connect(provider: string): Promise<OAuthConnectResponse> {
        return await this.accountsOAuthService.connect(provider);
    }

    async callback(provider: string, params: OAuthCallbackParams): Promise<string> {
        return await this.accountsOAuthService.handleCallback(provider, params, (userId, accountId) => {
            this.syncAccount(userId, accountId);
        });
    }

    //* Account Read Methods
    //*==========================================
    async getAccountDetails(userId: string, accountId: string): Promise<SanitizedAccountAttributes> {
        return await this.accountsReadService.getAccountDetails(userId, accountId);
    }

    async getAccounts(userId: string): Promise<SanitizedAccountAttributes[]> {
        return await this.accountsReadService.getAccounts(userId);
    }

    async getAccountProviders(): Promise<AccountProviderType[]> {
        return await this.accountsReadService.getAccountProviders();
    }

    //* Account Write Methods
    //*==========================================
    async deleteAccount(userId: string, accountId: string): Promise<void> {
        return await this.accountsWriteService.deleteAccount(userId, accountId);
    }

    async syncAccounts(userId: string): Promise<SyncAccountsResponse> {
        return await this.accountsWriteService.syncAccounts(userId);
    }

    async syncAccount(userId: string, accountId: string): Promise<SyncAccountJobResponse> {
        return await this.accountsWriteService.syncAccount(userId, accountId);
    }

    public async enableAccount(userId: string, accountId: string, active: boolean): Promise<UpdateAPIResponse> {
        return await this.accountsWriteService.enableAccount(userId, accountId, active);
    }

    public async updateAccountSettings(userId: string, accountId: string, settings: UpdateAccountSettingsSchema): Promise<UpdateAPIResponse> {
        return await this.accountsWriteService.updateAccountSettings(userId, accountId, settings);
    }
}
