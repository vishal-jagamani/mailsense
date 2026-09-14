import mongoose from 'mongoose';

import { DEPENDENCY_STATUS, HEALTH_CHECK_CONFIG, HEALTH_STATUS, LOGGER_MODULE } from '@constants';
import { createLogger } from '@observability';
import { getRedisConnection } from '@queue';
import { DependencyCheckDetails, LivenessResponse, ReadinessResponse } from '@types';

export class HealthService {
    private static readonly logger = createLogger(LOGGER_MODULE.HEALTH_SERVICE);

    /**
     * Executes a promise with a hard timeout guarantee to prevent deadlocks
     */
    private static async withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
        try {
            let timer: NodeJS.Timeout | null = null;
            const timeoutPromise = new Promise<T>((resolve) => {
                timer = setTimeout(() => resolve(fallbackValue), timeoutMs);
            });

            const result = await Promise.race([promise, timeoutPromise]);
            if (timer) clearTimeout(timer);
            return result;
        } catch {
            return fallbackValue;
        }
    }

    /**
     * Evaluates Node.js Express process liveness
     */
    public static getLiveness(): LivenessResponse {
        try {
            return {
                status: HEALTH_STATUS.HEALTHY,
                uptime: Math.round(process.uptime()),
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error generating liveness response: ${msg}`, { error });
            return {
                status: HEALTH_STATUS.UNHEALTHY,
                uptime: 0,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Inspects MongoDB connection state and executes ping
     */
    public static async checkMongo(): Promise<DependencyCheckDetails> {
        const start = Date.now();
        try {
            if (mongoose.connection.readyState !== 1) {
                return {
                    status: DEPENDENCY_STATUS.DOWN,
                    latencyMs: Date.now() - start,
                    error: `MongoDB readyState is ${mongoose.connection.readyState} (expected 1)`,
                };
            }

            const db = mongoose.connection.db;
            if (!db) {
                return {
                    status: DEPENDENCY_STATUS.DOWN,
                    latencyMs: Date.now() - start,
                    error: 'MongoDB connection db object is unavailable',
                };
            }

            const pingResult = await this.withTimeout(db.admin().ping(), HEALTH_CHECK_CONFIG.PING_TIMEOUT_MS, null);

            if (!pingResult) {
                return {
                    status: DEPENDENCY_STATUS.DOWN,
                    latencyMs: Date.now() - start,
                    error: `MongoDB ping timed out after ${HEALTH_CHECK_CONFIG.PING_TIMEOUT_MS}ms`,
                };
            }

            return {
                status: DEPENDENCY_STATUS.UP,
                latencyMs: Date.now() - start,
            };
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            return {
                status: DEPENDENCY_STATUS.DOWN,
                latencyMs: Date.now() - start,
                error: msg,
            };
        }
    }

    /**
     * Inspects Redis connection state and executes ping
     */
    public static async checkRedis(): Promise<DependencyCheckDetails> {
        const start = Date.now();
        try {
            const redis = getRedisConnection();
            if (!redis || redis.status !== 'ready') {
                return {
                    status: DEPENDENCY_STATUS.DOWN,
                    latencyMs: Date.now() - start,
                    error: `Redis status is "${redis?.status ?? 'null'}" (expected "ready")`,
                };
            }

            const pingResult = await this.withTimeout(redis.ping(), HEALTH_CHECK_CONFIG.PING_TIMEOUT_MS, null);

            if (pingResult !== 'PONG') {
                return {
                    status: DEPENDENCY_STATUS.DOWN,
                    latencyMs: Date.now() - start,
                    error: `Redis ping timed out or returned unexpected result: "${String(pingResult)}"`,
                };
            }

            return {
                status: DEPENDENCY_STATUS.UP,
                latencyMs: Date.now() - start,
            };
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            return {
                status: DEPENDENCY_STATUS.DOWN,
                latencyMs: Date.now() - start,
                error: msg,
            };
        }
    }

    /**
     * Evaluates comprehensive dependency readiness across MongoDB and Redis
     */
    public static async getReadiness(): Promise<ReadinessResponse> {
        try {
            const [mongoCheck, redisCheck] = await Promise.all([this.checkMongo(), this.checkRedis()]);

            const isMongoUp = mongoCheck.status === DEPENDENCY_STATUS.UP;
            const isRedisUp = redisCheck.status === DEPENDENCY_STATUS.UP;
            const isHealthy = isMongoUp && isRedisUp;

            if (!isHealthy) {
                this.logger.warn('Dependency readiness check failed', {
                    mongoStatus: mongoCheck.status,
                    mongoError: mongoCheck.error,
                    redisStatus: redisCheck.status,
                    redisError: redisCheck.error,
                });
            }

            return {
                status: isHealthy ? HEALTH_STATUS.HEALTHY : HEALTH_STATUS.UNHEALTHY,
                checks: {
                    mongodb: mongoCheck.status,
                    redis: redisCheck.status,
                },
                timestamp: new Date().toISOString(),
                details: {
                    mongodb: mongoCheck,
                    redis: redisCheck,
                },
            };
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Unhandled failure during readiness evaluation: ${msg}`, { error });
            return {
                status: HEALTH_STATUS.UNHEALTHY,
                checks: {
                    mongodb: DEPENDENCY_STATUS.DOWN,
                    redis: DEPENDENCY_STATUS.DOWN,
                },
                timestamp: new Date().toISOString(),
            };
        }
    }
}
