import { ACCOUNT_PROVIDERS, LOGGER_MODULE } from '@constants';
import { ForbiddenError, NotFoundError } from '@errors';
import { AccountProviderType, SanitizedAccountAttributes } from '@mailsense/types';
import { createLogger } from '@observability';
import { AccountDocument, AccountRepository } from '../database/index.js';

const logger = createLogger(LOGGER_MODULE.ACCOUNT_SERVICE);

export class AccountsReadService {
    async getAccountDetails(userId: string, accountId: string): Promise<SanitizedAccountAttributes> {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) {
                throw new NotFoundError('Account', accountId);
            }
            if (userId && account.userId !== userId) {
                throw new ForbiddenError('Access to specified account is denied');
            }
            return this.sanitizeAccount(account);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.getAccountDetails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private sanitizeAccount(account: AccountDocument): SanitizedAccountAttributes {
        try {
            return {
                _id: String(account._id),
                userId: account.userId,
                email: account.emailAddress,
                provider: account.provider,
                isEnabled: account.active,
                lastSyncedAt: account.lastSyncedAt ? new Date(account.lastSyncedAt) : undefined,
                lastSyncStatus: account.lastSyncStatus,
                syncFrequency: String(account.syncInterval),
                createdAt: new Date(account.createdAt || ''),
                updatedAt: new Date(account.updatedAt || ''),
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.sanitizeAccount: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getAccounts(userId: string): Promise<SanitizedAccountAttributes[]> {
        try {
            const accounts = await AccountRepository.getAccounts({ userId });
            return accounts.map((acc: AccountDocument) => this.sanitizeAccount(acc));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.getAccounts: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getAccountProviders(): Promise<AccountProviderType[]> {
        try {
            return ACCOUNT_PROVIDERS;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.getAccountProviders: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
