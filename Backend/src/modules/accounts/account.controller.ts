import { NextFunction, Request, Response } from 'express';
import { AccountsService } from './account.service.js';
import { ConnectAccountSchema, DeleteAccountSchema, GetAccountDetailsSchema, GetAccountsSchema } from './account.schema.js';

export class AccountsController {
    private accountsService: AccountsService;

    constructor() {
        this.accountsService = new AccountsService();
    }

    public getAccountDetails = async (req: Request<GetAccountDetailsSchema, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const accountId = req.params.accountId;
            if (!accountId) throw new Error('Account ID is required');
            const account = await this.accountsService.getAccountDetails(accountId);
            if (!account) res.status(404).send({ message: 'Account not found' });
            res.send(account);
        } catch (error) {
            next(error);
        }
    };

    public deleteAccount = async (req: Request<DeleteAccountSchema, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const accountId = req.params.accountId;
            if (!accountId) throw new Error('Account ID is required');
            await this.accountsService.deleteAccount(accountId);
            res.send({ message: 'Account deleted successfully' });
        } catch (error) {
            next(error);
        }
    };

    public getAccounts = async (req: Request<GetAccountsSchema, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.params.userId;
            if (!userId) throw new Error('User ID is required');
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
            const redirectURL = await this.accountsService.connect(req.params.provider);
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
            const userId = req.query.userId;
            if (!userId) throw new Error('User ID is required');
            const emails = await this.accountsService.syncAccounts(String(userId));
            res.send(emails);
        } catch (error) {
            next(error);
        }
    };

    public syncAccount = async (req: Request<GetAccountDetailsSchema, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const accountId = req.params.accountId;
            this.accountsService.syncAccount(accountId);
            res.send(true);
        } catch (error) {
            next(error);
        }
    };
}
