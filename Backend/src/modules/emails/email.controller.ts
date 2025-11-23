import { NextFunction, Request, Response } from 'express';
import { EmailService } from './email.service.js';
import { ArchiveEmailBody } from './email.schema.js';

export class EmailController {
    private emailService: EmailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public getAllEmails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userid } = req.headers;
            const { size, page } = req.query;
            if (!userid) {
                throw new Error('User ID is required');
            }
            const sizeValue = size ? Number(size) : 10;
            const pageValue = page ? Number(page) : 1;
            const emails = await this.emailService.getAllEmails(String(userid), sizeValue, pageValue);
            res.send(emails);
        } catch (error) {
            next(error);
        }
    };

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

    public getEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { emailId } = req.params;
            if (!emailId) {
                throw new Error('Email ID is required');
            }
            const email = await this.emailService.getEmail(emailId);
            res.send(email);
        } catch (error) {
            next(error);
        }
    };

    public deleteEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { emailIds, trash } = req.body;
            if (!emailIds) {
                throw new Error('Email ID is required');
            }
            const email = await this.emailService.deleteEmail(emailIds, Boolean(trash));
            res.send(email);
        } catch (error) {
            next(error);
        }
    };

    public archiveEmails = async (req: Request<object, object, ArchiveEmailBody, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { emailIds, archive } = req.body;
            if (!emailIds) {
                throw new Error('Email ID is required');
            }
            const email = await this.emailService.archiveEmails(emailIds, Boolean(archive));
            res.send(email);
        } catch (error) {
            next(error);
        }
    };
}
