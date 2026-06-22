import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncHandler = (req: Request<any, any, any, any>, res: Response, next: NextFunction) => Promise<void>;

export const handleRequest = (fn: AsyncHandler) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
