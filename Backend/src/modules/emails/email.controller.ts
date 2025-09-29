import { NextFunction, Request, Response } from 'express';
import { EmailService } from './email.service.js';

export class EmailController {
    private emailService: EmailService;

    constructor() {
        this.emailService = new EmailService();
    }
    public getEmails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { accountId } = req.params;
            const { size, page } = req.query;
            if (!accountId) {
                throw new Error('Account ID is required');
            }
            const sizeValue = size ? Number(size) : 10;
            const pageValue = page ? Number(page) : 1;
            const emails = await this.emailService.getEmails(accountId, sizeValue, pageValue);
            res.send(emails);
        } catch (error) {
            next(error);
        }
    };
}
