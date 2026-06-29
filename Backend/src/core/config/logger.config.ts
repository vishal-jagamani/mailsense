import pino from 'pino';
import { LOG_LEVEL, NODE_ENV } from './app.config.js';

const isDev = NODE_ENV !== 'production';

export const log = pino({
    level: LOG_LEVEL || 'info',
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
