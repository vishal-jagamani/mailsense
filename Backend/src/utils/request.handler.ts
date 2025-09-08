import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncHandler<T = any> = (req: Request, res: Response, next: NextFunction) => Promise<T>;

export const handleRequest = <T>(fn: AsyncHandler<T>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
