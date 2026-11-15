import { BadRequestError, UnauthorizedError } from '@errors';
import { NextFunction, Request, Response } from 'express';
import {
    ConnectAccountSchema,
    DeleteAccountSchema,
    EnableAccountSchema,
    GetAccountDetailsSchema,
    UpdateAccountSettingsSchema,
} from '../schema/index.js';
import { AccountsService } from '../services/index.js';
import { OAuthCallbackParams } from '../types/index.js';

export class AccountsMutationController {
    private accountsService: AccountsService;

    constructor() {
        this.accountsService = new AccountsService();
    }

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

    public callback = async (
        req: Request<ConnectAccountSchema, object, object, OAuthCallbackParams>,
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
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User authentication required');
            }
            const accountId = req.params.accountId;
            if (!accountId) {
                throw new BadRequestError('Account ID is required');
            }
            const response = await this.accountsService.updateAccountSettings(userId, accountId, req.body);
            res.status(200).send(response);
        } catch (error) {
            next(error);
        }
    };
}
