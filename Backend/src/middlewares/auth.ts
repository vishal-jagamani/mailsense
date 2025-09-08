import { NextFunction, Request, Response } from 'express';
import { ENABLE_AUTH } from '../config/config.js';

class AuthMiddleware {
    private noAuth(req: Request, res: Response, next: NextFunction) {
        next();
    }

    private auth(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization;
            const token = authHeader?.split(' ')[1];

            if (!token) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // TODO: Implement token verification (JWT, OAuth, etc.)
            next();
        } catch (err) {
            console.error('Error in AuthMiddleware.auth: ', err);
            res.status(401).json({ error: 'Unauthorized' });
        }
    }

    public getMiddleware() {
        return ENABLE_AUTH ? this.auth.bind(this) : this.noAuth.bind(this);
    }
}

export const authMiddleware = new AuthMiddleware().getMiddleware();
