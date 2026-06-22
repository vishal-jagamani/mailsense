import 'express';
import { JWTPayload } from 'express-oauth2-jwt-bearer';

declare module 'express-serve-static-core' {
    interface Request {
        validated?: unknown;
        auth?: {
            header: Record<string, unknown>;
            payload: JWTPayload;
            token: string;
        };
    }
}

declare global {
    namespace Express {
        interface Auth0JwtPayload extends JwtPayload {
            id: string;
            name?: string;
            email?: string;
            raw?: JwtPayload;
        }
        interface Request {
            user?: Auth0JwtPayload;
        }
    }
}
