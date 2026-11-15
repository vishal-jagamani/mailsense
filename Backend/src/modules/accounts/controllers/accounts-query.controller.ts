import { BadRequestError, UnauthorizedError } from '@errors';
import { NextFunction, Request, Response } from 'express';
import { ConnectAccountSchema, GetAccountDetailsSchema } from '../schema/index.js';
import { AccountsService } from '../services/index.js';

export class AccountsQueryController {
    private accountsService: AccountsService;

    constructor() {
        this.accountsService = new AccountsService();
    }

    public getAccountDetails = async (req: Request<GetAccountDetailsSchema, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            const accountId = req.params.accountId;
            if (!accountId) {
                throw new BadRequestError('Account ID is required');
            }
            const account = await this.accountsService.getAccountDetails(userId, accountId);
            res.send(account);
        } catch (error) {
            next(error);
        }
    };

    public getAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            const accounts = await this.accountsService.getAccounts(userId);
            res.send(accounts);
        } catch (error) {
            next(error);
        }
    };

    public getAccountProviders = async (req: Request<object, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const accountProviders = await this.accountsService.getAccountProviders();
            res.send(accountProviders);
        } catch (error) {
            next(error);
        }
    };

    public connect = async (req: Request<ConnectAccountSchema, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const provider = req.params.provider;
            if (!provider) {
                throw new BadRequestError('Provider is required');
            }
            const redirectURL = await this.accountsService.connect(provider);
            res.send(redirectURL);
        } catch (error) {
            next(error);
        }
    };
}
