import { NextFunction, Request, Response } from 'express';
import { ChangePasswordSchema, GetUserSchema, UpdateUserSchema } from './user.schema.js';
import { UserService } from './user.service.js';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    public getUser = async (req: Request<GetUserSchema, object, GetUserSchema>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const user = await this.userService.getUser(id);
            res.status(200).send(user);
        } catch (error) {
            next(error);
        }
    };

    public updateUser = async (req: Request<GetUserSchema, object, UpdateUserSchema>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new Error('User ID is required');
            }
            const user = await this.userService.updateUser(id, req.body);
            res.status(200).send(user);
        } catch (error) {
            next(error);
        }
    };

    public getUserProfile = async (req: Request<GetUserSchema, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new Error('User ID is required');
            }
            const user = await this.userService.getUserProfile(id);
            res.status(200).send(user);
        } catch (error) {
            next(error);
        }
    };

    public updateUserProfile = async (req: Request<GetUserSchema, object, UpdateUserSchema>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new Error('User ID is required');
            }
            const user = await this.userService.updateUser(id, req.body);
            res.status(200).send(user);
        } catch (error) {
            next(error);
        }
    };

    public changePassword = async (req: Request<GetUserSchema, object, ChangePasswordSchema>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new Error('User ID is required');
            }
            const user = await this.userService.changePassword(id, req.body);
            res.status(200).send(user);
        } catch (error) {
            next(error);
        }
    };
}
