import pino from 'pino';
import { getTraceStore } from '../observability/trace.js';
import { LOG_LEVEL, NODE_ENV } from './app.config.js';
import { LOG_LEVELS } from '@types';

const isDev = NODE_ENV !== 'production';

export const log = pino({
    level: LOG_LEVEL || LOG_LEVELS.INFO,
    base: {
        service: 'mailsense-backend',
        environment: NODE_ENV || 'development',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    mixin: () => {
        try {
            const store = getTraceStore();
            if (store) {
                return {
                    traceId: store.traceId,
                    ...(store.userId ? { userId: store.userId } : {}),
                    ...(store.userEmail ? { userEmail: store.userEmail } : {}),
                    ...(store.userName ? { userName: store.userName } : {}),
                    ...(store.accountId ? { accountId: store.accountId } : {}),
                };
            }
            return {};
            // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (error) {
            return {};
        }
    },
    transport: isDev
        ? {
              target: 'pino-pretty',
              options: {
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
              },
          }
        : undefined,
});
