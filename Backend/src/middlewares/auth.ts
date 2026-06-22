import { NextFunction, Request, Response } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';

import { AUTH0_SECRETS, ENABLE_AUTH } from '@config';
import { logger } from 'shared/utils/index.js';

class AuthMiddleware {
    private checkJwt = auth({
        issuerBaseURL: AUTH0_SECRETS.issuerBaseURL,
        audience: AUTH0_SECRETS.audience,
        tokenSigningAlg: 'RS256',
    });

    private noAuth(req: Request, res: Response, next: NextFunction) {
        next();
    }

    private async auth(req: Request, res: Response, next: NextFunction) {
        this.checkJwt(req, res, (err) => {
            if (err) {
                logger.error('AuthMiddleware Error:', { error: err });
                return res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                    message: err.message || 'Invalid token',
                });
            }
            req.user = {
                id: req.auth?.payload?.sub || '',
                raw: req.auth?.payload,
            };
            next();
        });
    }

    public getMiddleware() {
        return ENABLE_AUTH ? this.auth.bind(this) : this.noAuth.bind(this);
    }
}

export const authMiddleware = new AuthMiddleware().getMiddleware();
