import { NextFunction, Request, Response } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';

import { AUTH0_SECRETS, ENABLE_AUTH } from '@config';
import { LOGGER_MODULE } from '@constants';
import { monitoring } from '@monitoring';
import { createLogger, setTraceContext } from '@observability';

const authLogger = createLogger(LOGGER_MODULE.AUTH_MIDDLEWARE);

class AuthMiddleware {
    private checkJwt = auth({
        issuerBaseURL: AUTH0_SECRETS.issuerBaseURL,
        audience: AUTH0_SECRETS.audience,
        tokenSigningAlg: 'RS256',
    });

    private parseHeaderName(headerValue: string | string[] | undefined): string | undefined {
        if (!headerValue || Array.isArray(headerValue)) return undefined;
        try {
            return decodeURIComponent(headerValue);
        } catch {
            return headerValue;
        }
    }

    private bindUserContext(userId: string, email?: string, name?: string): void {
        try {
            if (userId) {
                setTraceContext({ userId, userEmail: email, userName: name });
                monitoring.setUser({ id: userId, email, username: name });
            }
        } catch (setupErr) {
            authLogger.warn('Failed to set monitoring context in auth middleware', { error: setupErr as Error });
        }
    }

    private noAuth(req: Request, res: Response, next: NextFunction) {
        const devUserId = (req.headers['x-user-id'] as string) || req.user?.id || 'dev-user-id';
        const devEmail = (req.headers['x-user-email'] as string) || req.user?.email;
        const devName = this.parseHeaderName(req.headers['x-user-name']) || req.user?.name;

        if (!req.user) {
            req.user = { id: devUserId, email: devEmail, name: devName };
        }
        this.bindUserContext(devUserId, devEmail, devName);
        next();
    }

    private async auth(req: Request, res: Response, next: NextFunction) {
        this.checkJwt(req, res, (err) => {
            if (err) {
                authLogger.error('AuthMiddleware Error:', { error: err });
                return res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                    message: err.message || 'Invalid token',
                });
            }

            const userId = req.auth?.payload?.sub || (req.headers['x-user-id'] as string) || '';
            const headerEmail = (req.headers['x-user-email'] as string) || undefined;
            const headerName = this.parseHeaderName(req.headers['x-user-name']);

            const email =
                (req.auth?.payload?.email as string) ||
                (req.auth?.payload?.['https://mailsense.app/email'] as string) ||
                headerEmail ||
                undefined;

            const name =
                (req.auth?.payload?.name as string) ||
                (req.auth?.payload?.['https://mailsense.app/name'] as string) ||
                headerName ||
                undefined;

            req.user = {
                id: userId,
                email,
                name,
                raw: req.auth?.payload,
            };

            this.bindUserContext(userId, email, name);
            next();
        });
    }

    public getMiddleware() {
        return ENABLE_AUTH ? this.auth.bind(this) : this.noAuth.bind(this);
    }
}

export const authMiddleware = new AuthMiddleware().getMiddleware();
