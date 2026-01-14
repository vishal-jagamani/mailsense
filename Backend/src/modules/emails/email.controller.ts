import { NextFunction, Request, Response } from 'express';
import { ArchiveEmailBody, DeleteEmailSchema, SearchEmailBody, StarEmailBody, UnreadEmailBody } from './email.schema.js';
import { EmailService } from './email.service.js';

export class EmailController {
    private emailService: EmailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public getAllEmails = async (
        req: Request<object, object, object, { size: string; page: string }>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
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

    public getEmails = async (
        req: Request<{ accountId: string }, object, object, { size: string; page: string }>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
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

    public getEmail = async (req: Request<{ emailId: string }, object, object>, res: Response, next: NextFunction): Promise<void> => {
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

    public searchEmails = async (req: Request<object, object, SearchEmailBody, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { searchText } = req.body;
            const { userid } = req.headers;
            if (!userid) {
                res.status(400).send('User ID is required');
            }
            const response = await this.emailService.searchEmails(String(userid), searchText);
            res.status(200).send(response);
        } catch (error) {
            next(error);
        }
    };

    public deleteEmail = async (req: Request<object, object, DeleteEmailSchema, object>, res: Response, next: NextFunction): Promise<void> => {
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

    public starEmails = async (req: Request<object, object, StarEmailBody, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { emailIds, star } = req.body;
            if (!emailIds) {
                throw new Error('Email ID is required');
            }
            const email = await this.emailService.starEmails(emailIds, Boolean(star));
            res.send(email);
        } catch (error) {
            next(error);
        }
    };

    public unreadEmails = async (req: Request<object, object, UnreadEmailBody, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { emailIds } = req.body;
            if (!emailIds) {
                throw new Error('Email ID is required');
            }
            const email = await this.emailService.unreadEmails(emailIds);
            res.send(email);
        } catch (error) {
            next(error);
        }
    };
}
