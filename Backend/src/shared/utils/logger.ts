import { LOGGER_MODULE } from '@constants';
import { createLogger } from '@observability';

/**
 * Default application logger.
 * Backwards-compatible drop-in replacement that uses createLogger('App')
 * with strict LogContext and automatic traceId injection.
 */
export const logger = createLogger(LOGGER_MODULE.APP);
