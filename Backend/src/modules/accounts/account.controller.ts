import { NextFunction, Request, Response } from 'express';
import { AccountsService } from './account.service.js';

export class AccountsController {
    private accountsService: AccountsService;

    constructor() {
        this.accountsService = new AccountsService();
    }

    public connect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const redirectURL = await this.accountsService.connect(req.params.provider);
            res.redirect(redirectURL);
        } catch (error) {
            next(error);
        }
    };

    public callback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const provider = req.params.provider;
            await this.accountsService.callback(provider, req.query);
            res.send('callback');
        } catch (error) {
            next(error);
        }
    };
}
