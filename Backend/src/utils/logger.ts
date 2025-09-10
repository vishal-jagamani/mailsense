import log from '../config/logger.js';

type LogMeta = Record<string, unknown>;

export const logger = {
    info: (msg: string, meta?: LogMeta) => log.info(meta, msg),
    error: (msg: string, meta?: LogMeta) => log.error(meta, msg),
    warn: (msg: string, meta?: LogMeta) => log.warn(meta, msg),
    debug: (msg: string, meta?: LogMeta) => log.debug(meta, msg),
};
