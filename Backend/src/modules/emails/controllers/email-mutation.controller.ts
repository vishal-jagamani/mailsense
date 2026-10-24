import { BadRequestError, UnauthorizedError } from '@errors';
import { MoveEmailsRequestBody } from '@mailsense/types';
import { NextFunction, Request, Response } from 'express';
import { ArchiveEmailBody, ComposeEmailBody, DeleteEmailSchema, StarEmailBody, UnreadEmailBody } from '../email.schema.js';
import { EmailService } from '../services/email.service.js';

export class EmailMutationController {
    constructor(private readonly emailService: EmailService = new EmailService()) {}

    public composeEmail = async (req: Request<object, object, ComposeEmailBody, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            const { accountId, to, subject, body } = req.body;
            if (!accountId || !to || !subject || !body) {
                throw new BadRequestError('Account ID, To, subject and body are required');
            }
            const email = await this.emailService.composeEmail(userId, req.body);
            res.send(email);
        } catch (error) {
            next(error);
        }
    };

    public deleteEmail = async (req: Request<object, object, DeleteEmailSchema, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            const { emailIds, trash } = req.body;
            if (!emailIds) {
                throw new BadRequestError('Email ID is required');
            }
            const email = await this.emailService.deleteEmail(userId, emailIds, Boolean(trash));
            res.send(email);
        } catch (error) {
            next(error);
        }
    };

    public archiveEmails = async (req: Request<object, object, ArchiveEmailBody, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            const { emailIds, archive } = req.body;
            if (!emailIds) {
                throw new BadRequestError('Email ID is required');
            }
            const email = await this.emailService.archiveEmails(userId, emailIds, Boolean(archive));
            res.json(email);
        } catch (error) {
            next(error);
        }
    };

    public starEmails = async (req: Request<object, object, StarEmailBody, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            const { emailIds, star } = req.body;
            if (!emailIds) {
                throw new BadRequestError('Email ID is required');
            }
            const email = await this.emailService.starEmails(userId, emailIds, Boolean(star));
            res.json(email);
        } catch (error) {
            next(error);
        }
    };

    public unreadEmails = async (req: Request<object, object, UnreadEmailBody, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            const { emailIds, unread } = req.body;
            if (!emailIds) {
                throw new BadRequestError('Email ID is required');
            }
            const email = await this.emailService.unreadEmails(userId, emailIds, Boolean(unread));
            res.json(email);
        } catch (error) {
            next(error);
        }
    };

    public moveEmails = async (req: Request<object, object, MoveEmailsRequestBody, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            const payload = req.body;
            const result = await this.emailService.moveEmails(userId, payload.emailIds, payload.targetFolderIds, payload.removeFolderIds || []);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };
}
