import 'express';

declare module 'express-serve-static-core' {
    interface Request {
        validated?: unknown;
    }
}

declare global {
    namespace Express {
        interface Auth0JwtPayload extends JwtPayload {
            sub: string;
            email?: string;
            name?: string;
        }
        interface Request {
            user?: Auth0JwtPayload;
        }
    }
}
