import { LOGGER_MODULE } from '@constants';
import { BadRequestError } from '@errors';
import { GetAllEmailsFilters } from '@mailsense/types';
import { GetAccountDetailsSchema } from '@modules/accounts/account.schema.js';
import { createLogger } from '@observability';
import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from 'express-oauth2-jwt-bearer';
import { DownloadAttachmentSchema, GetAllEmailsSchema, GetEmailSchema, SearchEmailBody, SearchOtherContactsBody } from '../email.schema.js';
import { EmailService } from '../services/email.service.js';

const logger = createLogger(LOGGER_MODULE.EMAIL_CONTROLLER);

export class EmailQueryController {
    constructor(private readonly emailService: EmailService = new EmailService()) {}

    public getAllEmails = async (req: Request<object, object, GetAllEmailsSchema>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { size, page, filters } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            const sizeValue = size ? Number(size) : 10;
            const pageValue = page ? Number(page) : 1;
            const filterValue = (filters || {
                accountId: undefined,
                dateRange: undefined,
                folders: undefined,
                unread: undefined,
            }) as GetAllEmailsFilters;
            const emails = await this.emailService.getAllEmails(userId, sizeValue, pageValue, filterValue);
            res.json(emails);
        } catch (error) {
            next(error);
        }
    };

    public getEmails = async (
        req: Request<GetAccountDetailsSchema, object, object, { size: string; page: string }>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { accountId } = req.params;
            const { size, page } = req.query;
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            if (!accountId) {
                throw new BadRequestError('Account ID is required');
            }
            const sizeValue = size ? Number(size) : 10;
            const pageValue = page ? Number(page) : 1;
            const emails = await this.emailService.getEmails(userId, accountId, sizeValue, pageValue);
            res.json(emails);
        } catch (error) {
            next(error);
        }
    };

    public getFilters = async (req: Request<object, object, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            const filters = await this.emailService.getFilters(userId);
            res.json(filters);
        } catch (error) {
            next(error);
        }
    };

    public getEmail = async (req: Request<GetEmailSchema, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { emailId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            if (!emailId) {
                throw new BadRequestError('Email ID is required');
            }
            const email = await this.emailService.getEmail(userId, emailId);
            res.json(email);
        } catch (error) {
            next(error);
        }
    };

    public searchEmails = async (req: Request<object, object, SearchEmailBody, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { searchText, size, page } = req.body;
            const { id: userid } = req.user || {};
            if (!userid) {
                throw new UnauthorizedError('User ID is required');
            }
            const params = {
                userId: String(userid),
                searchText,
                size: size ? Number(size) : 10,
                page: page ? Number(page) : 1,
            };
            const response = await this.emailService.searchEmails(params);
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    public searchOtherContacts = async (
        req: Request<object, object, SearchOtherContactsBody, object>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { searchText } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            const email = await this.emailService.searchOtherContacts(userId, searchText);
            res.send(email);
        } catch (error) {
            next(error);
        }
    };

    public getThread = async (req: Request<GetEmailSchema>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { emailId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            if (!emailId) {
                throw new BadRequestError('Email ID is required');
            }
            const threadData = await this.emailService.getThread(userId, emailId);
            res.json(threadData);
        } catch (error) {
            next(error);
        }
    };

    public downloadAttachment = async (req: Request<DownloadAttachmentSchema>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { emailId, attachmentId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                throw new UnauthorizedError('User ID is required');
            }
            if (!emailId || !attachmentId) {
                throw new BadRequestError('Email ID and Attachment ID are required');
            }

            const attachment = await this.emailService.downloadAttachmentStream(userId, emailId, attachmentId);

            res.setHeader('Content-Type', attachment.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.filename)}"`);
            if (attachment.contentLength) {
                res.setHeader('Content-Length', attachment.contentLength);
            }

            attachment.stream.on('error', (streamErr) => {
                logger.error('Error during attachment stream transfer', { emailId, attachmentId, error: streamErr });
                if (!res.headersSent) {
                    next(streamErr);
                }
            });

            attachment.stream.pipe(res);
        } catch (error) {
            next(error);
        }
    };
}
