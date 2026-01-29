import pino from 'pino';
import { LOG_LEVEL, NODE_ENV } from './config.js';

const isDev = NODE_ENV !== 'production';

const log = pino({
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

export default log;
