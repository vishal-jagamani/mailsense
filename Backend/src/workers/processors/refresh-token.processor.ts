import { EmailProviderFactory } from '@integrations/email/email.provider.factory.js';
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { AccountProvider } from '@types';
import { logger } from '@utils';
import { Job } from 'bullmq';
import { RefreshTokenPayload } from '../../core/queue/queue.service.js';
import { getRedisConnection } from '../../core/queue/redis.connection.js';

export const refreshTokenProcessor = async (job: Job<RefreshTokenPayload, { status: boolean }>): Promise<{ status: boolean }> => {
    const { accountId } = job.data;
    logger.info(`🔄 Processing token refresh request for account: ${accountId}`);

    const redis = getRedisConnection();
    const lockKey = `lock:refresh-token:${accountId}`;
    const maxWaitTimeMs = 5000;
    const checkIntervalMs = 500;
    let waitedTimeMs = 0;

    // Retry loop attempting to acquire the distributed locks safely
    while (waitedTimeMs < maxWaitTimeMs) {
        const lockAcquired = await redis.set(lockKey, 'locked', 'PX', 15000, 'NX');
        if (lockAcquired === 'OK') {
            try {
                const account = await AccountRepository.getAccountById(accountId);
                if (!account) {
                    throw new Error(`Account details missing: ${accountId}`);
                }

                // Double check if token was updated by another thread
                const isTokenValid = account.accessTokenExpiry > Date.now() + 60 * 1000;
                if (isTokenValid) {
                    logger.info(`🔄 Token for account ${accountId} was already refreshed, skipping.`);
                    return { status: true };
                }

                const emailProvider = EmailProviderFactory.getProvider(account.provider as AccountProvider);
                await emailProvider.refreshAccessToken(accountId);
                logger.info(`🔄 Token refreshed successfully for account: ${accountId}`);
                return { status: true };
            } finally {
                await redis.del(lockKey);
            }
        }

        // Wait and check if database access token was updated while waiting
        await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
        waitedTimeMs += checkIntervalMs;

        const account = await AccountRepository.getAccountById(accountId);
        if (account && account.accessTokenExpiry > Date.now() + 60 * 1000) {
            logger.info(`🔄 Token updated by competing worker thread for account: ${accountId}`);
            return { status: true };
        }
    }

    throw new Error(`Timeout waiting to acquire refresh token lock for account: ${accountId}`);
};
