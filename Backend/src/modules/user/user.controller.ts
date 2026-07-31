import { NextFunction, Request, Response } from 'express';
import { ChangePasswordSchema, UpdateUserSchema, UpdateUserSettingsSchema } from './user.schema.js';
import { UserService } from './user.service.js';
import { UserSettings } from '@mailsense/types';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    public getUser = async (req: Request<object, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user?.id) {
                throw new Error('User ID is required');
            }
            const user = await this.userService.getUser(req.user.id);
            res.status(200).send(user);
        } catch (error) {
            next(error);
        }
    };

    public updateUser = async (req: Request<object, object, UpdateUserSchema>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user?.id) {
                throw new Error('User ID is required');
            }
            const user = await this.userService.updateUser(req.user.id, req.body);
            res.status(200).send(user);
        } catch (error) {
            next(error);
        }
    };

    public getUserProfile = async (req: Request<object, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user?.id) {
                throw new Error('User ID is required');
            }
            const user = await this.userService.getUserProfile(req.user.id);
            res.status(200).send(user);
        } catch (error) {
            next(error);
        }
    };

    public updateUserProfile = async (req: Request<object, object, UpdateUserSchema>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user?.id) {
                throw new Error('User ID is required');
            }
            const user = await this.userService.updateUser(req.user.id, req.body);
            res.status(200).send(user);
        } catch (error) {
            next(error);
        }
    };

    public changePassword = async (req: Request<object, object, ChangePasswordSchema>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user?.id) {
                throw new Error('User ID is required');
            }
            const user = await this.userService.changePassword(req.user.id, req.body);
            res.status(200).send(user);
        } catch (error) {
            next(error);
        }
    };

    public getUserSettings = async (req: Request<object, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user?.id) {
                throw new Error('User ID is required');
            }
            const response = await this.userService.getUserSettings(req.user.id);
            res.status(200).send(response);
        } catch (error) {
            next(error);
        }
    };

    public updateUserSettings = async (req: Request<object, object, UpdateUserSettingsSchema>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user?.id) {
                throw new Error('User ID is required');
            }
            const response = await this.userService.updateUserSettings(req.user.id, req.body as UserSettings);
            res.status(200).send(response);
        } catch (error) {
            next(error);
        }
    };
}
