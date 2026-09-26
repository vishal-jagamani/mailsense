import { BadRequestError, UnauthorizedError } from '@errors';
import { NextFunction, Request, Response } from 'express';
import {
    ConnectAccountSchema,
    DeleteAccountSchema,
    EnableAccountSchema,
    GetAccountDetailsSchema,
    UpdateAccountSettingsSchema,
} from './account.schema.js';
import { AccountsService } from './account.service.js';

export class AccountsController {
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

    public deleteAccount = async (req: Request<DeleteAccountSchema, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            const accountId = req.params.accountId;
            if (!accountId) {
                throw new BadRequestError('Account ID is required');
            }
            await this.accountsService.deleteAccount(userId, accountId);
            res.send({ message: 'Account deleted successfully' });
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

    public callback = async (
        req: Request<ConnectAccountSchema, object, object, { code: string; state: string }>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const provider = req.params.provider;
            if (!provider) {
                throw new BadRequestError('Provider is required');
            }
            const { code, state } = req.query;
            const parsedCode = String(code);
            const parsedState = String(state);
            const redirectURL = await this.accountsService.callback(provider, { code: parsedCode, state: parsedState });
            res.redirect(redirectURL);
        } catch (error) {
            next(error);
        }
    };

    public syncAccounts = async (req: Request<object, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            const response = await this.accountsService.syncAccounts(String(userId));
            res.status(202).send(response);
        } catch (error) {
            next(error);
        }
    };

    public syncAccount = async (req: Request<GetAccountDetailsSchema, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            const accountId = req.params.accountId;
            const response = await this.accountsService.syncAccount(userId, accountId);
            res.status(202).send(response);
        } catch (error) {
            next(error);
        }
    };

    public enableAccount = async (
        req: Request<GetAccountDetailsSchema, object, EnableAccountSchema>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            const accountId = req.params.accountId;
            const { active } = req.body;
            const response = await this.accountsService.enableAccount(userId, accountId, active);
            res.send(response);
        } catch (error) {
            next(error);
        }
    };

    public updateAccountSettings = async (
        req: Request<GetAccountDetailsSchema, object, UpdateAccountSettingsSchema>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const accountId = req.params.accountId;
            if (!accountId) {
                throw new BadRequestError('Account ID is required');
            }
            const response = await this.accountsService.updateAccountSettings(accountId, req.body);
            res.status(200).send(response);
        } catch (error) {
            next(error);
        }
    };
}
