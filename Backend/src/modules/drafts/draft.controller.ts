import { SaveDraftRequestBody } from '@mailsense/types';
import { NextFunction, Request, Response } from 'express';
import { DraftService } from './draft.service.js';

export class DraftController {
    private draftService: DraftService;

    constructor() {
        this.draftService = new DraftService();
    }

    public saveDraft = async (req: Request<object, object, SaveDraftRequestBody>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new Error('User ID is required');
            }
            const draft = await this.draftService.saveDraft(userId, req.body);
            res.status(200).json(draft);
        } catch (error) {
            next(error);
        }
    };

    public getUserDrafts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new Error('User ID is required');
            }
            const drafts = await this.draftService.getUserDrafts(userId);
            res.status(200).json(drafts);
        } catch (error) {
            next(error);
        }
    };

    public getDraftById = async (req: Request<{ draftId: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new Error('User ID is required');
            }
            const { draftId } = req.params;
            const draft = await this.draftService.getDraftById(draftId, userId);
            res.status(200).json(draft);
        } catch (error) {
            next(error);
        }
    };

    public deleteDraft = async (req: Request<{ draftId: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new Error('User ID is required');
            }
            const { draftId } = req.params;
            const response = await this.draftService.deleteDraft(draftId, userId);
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    };

    public sendDraft = async (req: Request<{ draftId: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new Error('User ID is required');
            }
            const { draftId } = req.params;
            const result = await this.draftService.sendDraft(draftId, userId);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };
}
