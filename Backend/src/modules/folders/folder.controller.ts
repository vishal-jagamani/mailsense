import { NextFunction, Request, Response } from 'express';
import { FolderService } from './folder.service.js';
import {
    CreateFolderSchema,
    GetAccountFoldersSchema,
    GetAllFoldersSchema,
    UpdateFolderBodySchema,
    UpdateFolderParamsSchema,
} from './folder.schema.js';
import { GetAllFoldersFilters } from './folder.types.js';

export class FolderController {
    private folderService: FolderService;

    constructor() {
        this.folderService = new FolderService();
    }

    public syncFolders = async (req: Request<{ accountId: string }, object, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { accountId } = req.params;
            if (!accountId) {
                throw new Error('Account ID is required');
            }
            const folders = await this.folderService.syncFolders(accountId);
            res.send(folders);
        } catch (error) {
            next(error);
        }
    };

    public getAllFolders = async (req: Request<object, object, GetAllFoldersSchema, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { userId, size, page, filters } = req.body;
            if (!userId) {
                throw new Error('User ID is required');
            }
            const sizeValue = size ? Number(size) : 10;
            const pageValue = page ? Number(page) : 1;
            const filterValue = (filters || { accountId: undefined, dateRange: undefined }) as GetAllFoldersFilters;
            const folders = await this.folderService.getAllFolders(String(userId), sizeValue, pageValue, filterValue);
            res.send(folders);
        } catch (error) {
            next(error);
        }
    };

    public getAccountFolders = async (
        req: Request<GetAccountFoldersSchema, object, object, object>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { accountId } = req.params;
            if (!accountId) {
                throw new Error('Account ID is required');
            }
            const folders = await this.folderService.getAccountFolders(accountId);
            res.send(folders);
        } catch (error) {
            next(error);
        }
    };

    public createFolder = async (req: Request<object, object, CreateFolderSchema, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { folderName, accountId } = req.body;
            if (!folderName || !accountId) {
                throw new Error('Folder name and account ID are required');
            }
            const folder = await this.folderService.createFolder(accountId, folderName);
            res.send(folder);
        } catch (error) {
            next(error);
        }
    };

    public updateFolder = async (
        req: Request<UpdateFolderParamsSchema, object, UpdateFolderBodySchema, object>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { folderId } = req.params;
            const { accountId, folderName } = req.body;
            if (!folderId || !accountId || !folderName) {
                throw new Error('Folder ID, account ID and folder name are required');
            }
            const folder = await this.folderService.updateFolder(accountId, folderId, folderName);
            res.send(folder);
        } catch (error) {
            next(error);
        }
    };

    public deleteFolder = async (
        req: Request<UpdateFolderParamsSchema, object, object, object>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { folderId } = req.params;
            if (!folderId) {
                throw new Error('Folder ID is required');
            }
            const folder = await this.folderService.deleteFolder(folderId);
            res.send(folder);
        } catch (error) {
            next(error);
        }
    };
}
