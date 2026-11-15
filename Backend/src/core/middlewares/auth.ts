import { NextFunction, Request, Response } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';

import { AUTH0_SECRETS, ENABLE_AUTH } from '@config';
import { LOGGER_MODULE } from '@constants';
import { monitoring } from '@monitoring';
import { createLogger, setTraceContext } from '@observability';

const authLogger = createLogger(LOGGER_MODULE.AUTH_MIDDLEWARE);

function getFirstString(...candidates: (string | string[] | undefined | null)[]): string | undefined {
    for (const val of candidates) {
        if (typeof val === 'string' && val.length > 0) {
            return val;
        }
    }
    return undefined;
}

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

    private extractUserFromRequest(req: Request) {
        const payload = req.auth?.payload;
        const headers = req.headers;

        const userId = getFirstString(payload?.sub, headers['x-user-id']) ?? '';
        const email = getFirstString(
            payload?.email as string | undefined,
            payload?.['https://mailsense.app/email'] as string | undefined,
            headers['x-user-email'],
        );
        const headerName = this.parseHeaderName(headers['x-user-name']);
        const name = getFirstString(
            payload?.name as string | undefined,
            payload?.['https://mailsense.app/name'] as string | undefined,
            headerName,
        );

        return {
            id: userId,
            email,
            name,
            raw: payload,
        };
    }

    private noAuth(req: Request, res: Response, next: NextFunction) {
        const devUserId = getFirstString(req.headers['x-user-id'], req.user?.id) ?? 'dev-user-id';
        const devEmail = getFirstString(req.headers['x-user-email'], req.user?.email);
        const devName = this.parseHeaderName(req.headers['x-user-name']) ?? req.user?.name;

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

            const user = this.extractUserFromRequest(req);
            req.user = user;

            this.bindUserContext(user.id, user.email, user.name);
            next();
        });
    }

    public getMiddleware() {
        return ENABLE_AUTH ? this.auth.bind(this) : this.noAuth.bind(this);
    }
}

export const authMiddleware = new AuthMiddleware().getMiddleware();
