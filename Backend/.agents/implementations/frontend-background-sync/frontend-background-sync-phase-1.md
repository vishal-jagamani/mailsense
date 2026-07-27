# Frontend Background Sync - Phase 1 Implementation Plan

This document details the step-by-step implementation for **Phase 1: Backend Settings Schemas & Dynamic Schedulers** of the MailSense Frontend Background Sync system.

---

## Goal Description

Establish the core backend foundation for managing sync settings at both the user level (global settings) and the account level (per-account settings). This phase extends the MongoDB `User` model with a `syncSettings` sub-document, exposes API endpoints to retrieve and update user global sync settings as well as individual account settings, and updates the `SchedulerService` in BullMQ to handle dynamic schedule updates, bulk rescheduling (`SAME_FOR_ALL` mode), and global pause (`globalAutoSync: false`).

---

## User Review Required

> [!IMPORTANT]
> **Backend API Alignment & BullMQ Job Rescheduling**
> - User global settings default to `globalAutoSync: true`, `syncMode: 'CUSTOM_PER_ACCOUNT'`, `globalSyncInterval: 15` (minutes), and `defaultSyncInterval: 15` (minutes).
> - Toggling `globalAutoSync: false` invokes `SchedulerService.removeAllUserRepeatableJobs(userId)` which cancels all active BullMQ repeatable sync timers for that user without removing the connected accounts from MongoDB.
> - Setting `syncMode: 'SAME_FOR_ALL'` bulk updates all accounts belonging to the user to use the `globalSyncInterval` and updates their BullMQ repeatable schedules accordingly.

---

## Proposed Changes

### Component: Backend User Module (`src/modules/user/`)

#### [MODIFY] [user.types.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user.types.ts)
- Add `UserSyncSettings` interface representing global sync configuration attributes (`globalAutoSync`, `syncMode`, `globalSyncInterval`, `defaultSyncInterval`).

#### [MODIFY] [user.model.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user.model.ts)
- Extend `User` interface with optional/required `syncSettings?: UserSyncSettings`.
- Update `UserSchema` with `syncSettings` sub-document including defaults (`globalAutoSync: true`, `syncMode: 'CUSTOM_PER_ACCOUNT'`, `globalSyncInterval: 15`, `defaultSyncInterval: 15`).

#### [MODIFY] [user.schema.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user.schema.ts)
- Add `updateUserSyncSettingsSchema` using Zod to validate payload parameters for global sync settings updates.

#### [MODIFY] [user.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user.service.ts)
- Add `getUserSyncSettings(auth0UserId: string)` to fetch global sync settings.
- Add `updateUserSyncSettings(auth0UserId: string, settings: UpdateUserSyncSettingsSchema)` to update settings in MongoDB and trigger `SchedulerService` adjustments.

#### [MODIFY] [user.controller.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user.controller.ts)
- Add `getUserSyncSettings` and `updateUserSyncSettings` handler methods.

#### [MODIFY] [user.routes.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user.routes.ts)
- Register `GET /sync-settings` and `PATCH /sync-settings` with proper validation and authorization middlewares.

---

### Component: Backend Accounts Module (`src/modules/accounts/`)

#### [MODIFY] [account.schema.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.schema.ts)
- Add `updateAccountSettingsSchema` for updating `syncEnabled`, `syncInterval`, and `active` fields per account.

#### [MODIFY] [account.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.service.ts)
- Add `updateAccountSettings(accountId: string, settings: UpdateAccountSettingsSchema)` to update account parameters in MongoDB and trigger `SchedulerService.upsertAccountRepeatableJob(accountId)`.

#### [MODIFY] [account.controller.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.controller.ts)
- Add `updateAccountSettings` controller method.

#### [MODIFY] [account.routes.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.routes.ts)
- Register route `PATCH /settings/:accountId` (or `PATCH /:accountId/settings`) for quick and table setting updates.

---

### Component: Queue & Scheduler Core (`src/core/queue/`)

#### [MODIFY] [scheduler.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/queue/scheduler.service.ts)
- Add `removeAllUserRepeatableJobs(userId: string)` to remove all BullMQ schedulers when global auto-sync is turned off.
- Update `init()` and `upsertAccountRepeatableJob()` to inspect user-level `syncSettings` (`globalAutoSync` and `syncMode`) when creating or updating account repeatable jobs.

---

## File Contents

Below are the complete file modifications required for Phase 1 implementation.

### 1. `src/modules/user/user.types.ts`

```typescript
export interface UserSyncSettings {
    globalAutoSync: boolean;
    syncMode: 'SAME_FOR_ALL' | 'CUSTOM_PER_ACCOUNT';
    globalSyncInterval: number; // in minutes (5, 10, 15, 30, 60, 360, 720, 1440)
    defaultSyncInterval: number; // in minutes
}

export interface UserDetailsObject {
    created_at: string;
    email: string;
    email_verified: boolean;
    identities: {
        connection: string;
        provider: string;
        user_id: string;
        isSocial: boolean;
    }[];
    name: string;
    nickname: string;
    picture: string;
    updated_at: string;
    user_id: string;
    user_metadata: {
        email: string;
        email_verified: boolean;
        name: string;
        nickname: string;
        picture: string;
        user_metadata: {
            email: string;
            email_verified: boolean;
            name: string;
            nickname: string;
            picture: string;
            user_metadata: {
                phone_number: string;
            };
            phone_number: string;
        };
    };
    last_ip: string;
    last_login: string;
    logins_count: number;
}

export interface UpdatePasswordResponseObject {
    message: string;
}
```

---

### 2. `src/modules/user/user.model.ts`

```typescript
import { Document, model, Schema } from 'mongoose';
import { UserSyncSettings } from './user.types.js';

export interface User {
    auth0UserId: string;
    name: string;
    email: string;
    syncSettings?: UserSyncSettings;
}

export type UserInput = Omit<User, 'createdAt' | 'updatedAt'>;

export type UserDocument = Document & User;

const UserSyncSettingsSchema = new Schema<UserSyncSettings>(
    {
        globalAutoSync: { type: Boolean, default: true },
        syncMode: { type: String, enum: ['SAME_FOR_ALL', 'CUSTOM_PER_ACCOUNT'], default: 'CUSTOM_PER_ACCOUNT' },
        globalSyncInterval: { type: Number, default: 15 },
        defaultSyncInterval: { type: Number, default: 15 },
    },
    { _id: false },
);

const UserSchema = new Schema<UserDocument>(
    {
        auth0UserId: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        syncSettings: { type: UserSyncSettingsSchema, default: () => ({}) },
    },
    { timestamps: true, versionKey: false },
);

// Indexes
UserSchema.index({ auth0UserId: 1 }, { unique: true });

export const User = model<UserDocument>('User', UserSchema);
```

---

### 3. `src/modules/user/user.schema.ts`

```typescript
import z from 'zod';

export const updateUserSchema = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    role: z.string().optional(),
});

export type UpdateUserSchema = z.infer<typeof updateUserSchema>;

export const changePasswordSchema = z.object({
    password: z.string(),
});

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;

export const updateUserSyncSettingsSchema = z.object({
    globalAutoSync: z.boolean().optional(),
    syncMode: z.enum(['SAME_FOR_ALL', 'CUSTOM_PER_ACCOUNT']).optional(),
    globalSyncInterval: z.number().positive().optional(),
    defaultSyncInterval: z.number().positive().optional(),
});

export type UpdateUserSyncSettingsSchema = z.infer<typeof updateUserSyncSettingsSchema>;
```

---

### 4. `src/modules/user/user.service.ts`

```typescript
import { Auth0Service } from 'integrations/auth0/auth0.service.js';
import { Auth0UserDetailsResponse } from 'integrations/auth0/auth0.types.js';
import { APIResponse, UpdateAPIResponse } from '@types';
import { decrypt } from 'shared/utils/index.js';
import { User, UserDocument, UserInput } from './user.model.js';
import { UserRepository } from './user.repository.js';
import { ChangePasswordSchema, UpdateUserSchema, UpdateUserSyncSettingsSchema } from './user.schema.js';
import { UserDetailsObject, UserSyncSettings } from './user.types.js';
import { SchedulerService } from 'core/queue/scheduler.service.js';
import { AccountRepository } from '@modules/accounts/account.repository.js';

export class UserService {
    private auth0Service: Auth0Service;

    constructor() {
        this.auth0Service = new Auth0Service();
    }

    public async getUser(auth0UserId: string): Promise<APIResponse<Auth0UserDetailsResponse | null>> {
        const user = await this.auth0Service.getUserDetails(auth0UserId);
        return { status: true, message: 'User fetched successfully', data: user };
    }

    public async updateUser(auth0UserId: string, user: UpdateUserSchema): Promise<APIResponse<UserDocument | null>> {
        const updateUser = await this.auth0Service.updateUserDetails(auth0UserId, user);
        const userInput: UserInput = {
            auth0UserId,
            name: updateUser.name,
            email: updateUser.email,
        };
        const updateInDB = await UserRepository.updateUser(auth0UserId, userInput);
        return { status: true, message: 'User updated successfully', data: updateInDB };
    }

    public async getUserProfile(auth0UserId: string): Promise<APIResponse<UserDetailsObject | null>> {
        const user = await this.auth0Service.getUserProfileDetails(auth0UserId);
        if (!user) {
            return { status: false, message: 'User not found', data: null };
        }
        return { status: true, message: 'User profile fetched successfully', data: user };
    }

    public async changePassword(auth0UserId: string, user: ChangePasswordSchema): Promise<UpdateAPIResponse> {
        const userDetails = await this.auth0Service.getUserDetails(auth0UserId);
        if (!userDetails) {
            throw new Error('User not found');
        }
        const changePasswordBody = {
            password: decrypt(user.password),
            connection: userDetails.identities[0].connection,
        };
        await this.auth0Service.changeUserPassword(auth0UserId, changePasswordBody);
        return { status: true, message: 'Password updated successfully' };
    }

    public async getUserSyncSettings(auth0UserId: string): Promise<APIResponse<UserSyncSettings>> {
        let dbUser = await User.findOne({ auth0UserId });
        if (!dbUser) {
            dbUser = await User.create({
                auth0UserId,
                name: 'User',
                email: '',
                syncSettings: {
                    globalAutoSync: true,
                    syncMode: 'CUSTOM_PER_ACCOUNT',
                    globalSyncInterval: 15,
                    defaultSyncInterval: 15,
                },
            });
        }
        const syncSettings: UserSyncSettings = dbUser.syncSettings || {
            globalAutoSync: true,
            syncMode: 'CUSTOM_PER_ACCOUNT',
            globalSyncInterval: 15,
            defaultSyncInterval: 15,
        };
        return { status: true, message: 'User sync settings fetched successfully', data: syncSettings };
    }

    public async updateUserSyncSettings(
        auth0UserId: string,
        settings: UpdateUserSyncSettingsSchema,
    ): Promise<APIResponse<UserSyncSettings>> {
        const dbUser = await User.findOneAndUpdate(
            { auth0UserId },
            { $set: { ...Object.fromEntries(Object.entries(settings).map(([k, v]) => [`syncSettings.${k}`, v])) } },
            { new: true, upsert: true },
        );

        const currentSettings = dbUser.syncSettings;

        // Apply dynamic BullMQ schedule changes based on updated settings
        if (currentSettings.globalAutoSync === false) {
            await SchedulerService.removeAllUserRepeatableJobs(auth0UserId);
        } else if (currentSettings.syncMode === 'SAME_FOR_ALL' && settings.globalSyncInterval) {
            // Bulk update all user accounts to use global sync interval
            const accounts = await AccountRepository.getAccounts({ userId: auth0UserId });
            for (const acc of accounts) {
                await AccountRepository.updateAccount(String(acc._id), { syncInterval: settings.globalSyncInterval });
                await SchedulerService.upsertAccountRepeatableJob(String(acc._id));
            }
        } else {
            // Refresh schedulers for user accounts
            const accounts = await AccountRepository.getAccounts({ userId: auth0UserId, active: true, syncEnabled: true });
            for (const acc of accounts) {
                await SchedulerService.upsertAccountRepeatableJob(String(acc._id));
            }
        }

        return {
            status: true,
            message: 'User sync settings updated successfully',
            data: currentSettings,
        };
    }
}
```

---

### 5. `src/modules/user/user.controller.ts`

```typescript
import { NextFunction, Request, Response } from 'express';
import { ChangePasswordSchema, UpdateUserSchema, UpdateUserSyncSettingsSchema } from './user.schema.js';
import { UserService } from './user.service.js';

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

    public getUserSyncSettings = async (req: Request<object, object, object>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user?.id) {
                throw new Error('User ID is required');
            }
            const response = await this.userService.getUserSyncSettings(req.user.id);
            res.status(200).send(response);
        } catch (error) {
            next(error);
        }
    };

    public updateUserSyncSettings = async (
        req: Request<object, object, UpdateUserSyncSettingsSchema>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            if (!req.user?.id) {
                throw new Error('User ID is required');
            }
            const response = await this.userService.updateUserSyncSettings(req.user.id, req.body);
            res.status(200).send(response);
        } catch (error) {
            next(error);
        }
    };
}
```

---

### 6. `src/modules/user/user.routes.ts`

```typescript
import { Router } from 'express';

import { authMiddleware, validate } from '@middlewares';
import { handleRequest } from 'shared/utils/index.js';
import { UserController } from './user.controller.js';
import { changePasswordSchema, updateUserSchema, updateUserSyncSettingsSchema } from './user.schema.js';

const router = Router();

const userController = new UserController();

router.use(authMiddleware);

router.get('/', handleRequest(userController.getUser));

router.put('/', validate({ body: updateUserSchema }), handleRequest(userController.updateUser));

router.get('/profile', handleRequest(userController.getUserProfile));

router.put('/profile', validate({ body: updateUserSchema }), handleRequest(userController.updateUserProfile));

router.patch('/change-password', validate({ body: changePasswordSchema }), handleRequest(userController.changePassword));

router.get('/sync-settings', handleRequest(userController.getUserSyncSettings));

router.patch('/sync-settings', validate({ body: updateUserSyncSettingsSchema }), handleRequest(userController.updateUserSyncSettings));

export default router;
```

---

### 7. `src/modules/accounts/account.schema.ts`

```typescript
import { z } from 'zod';

import { AccountProvider } from '@types';

export const connectAccountSchema = z.object({
    provider: z.enum(AccountProvider),
});

export const getAccountDetailsSchema = z.object({
    accountId: z.string(),
});

export const deleteAccountSchema = z.object({
    accountId: z.string(),
});

export const enableAccountSchema = z.object({
    active: z.boolean(),
});

export const updateAccountSettingsSchema = z.object({
    syncEnabled: z.boolean().optional(),
    syncInterval: z.number().positive().optional(),
    active: z.boolean().optional(),
});

export type GetAccountDetailsSchema = z.infer<typeof getAccountDetailsSchema>;
export type ConnectAccountSchema = z.infer<typeof connectAccountSchema>;
export type DeleteAccountSchema = z.infer<typeof deleteAccountSchema>;
export type EnableAccountSchema = z.infer<typeof enableAccountSchema>;
export type UpdateAccountSchema = z.infer<typeof enableAccountSchema>;
export type UpdateAccountSettingsSchema = z.infer<typeof updateAccountSettingsSchema>;
```

---

### 8. `src/modules/accounts/account.service.ts`

*(Add `updateAccountSettings` method to `AccountsService`)*:

```typescript
    public async updateAccountSettings(
        accountId: string,
        settings: { syncEnabled?: boolean; syncInterval?: number; active?: boolean },
    ): Promise<UpdateAPIResponse> {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account) throw new Error('Account not found');

            await AccountRepository.updateAccount(accountId, settings);

            // Re-evaluates schedule in BullMQ
            await SchedulerService.upsertAccountRepeatableJob(accountId);

            return { status: true, message: 'Account settings updated successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.updateAccountSettings: ${errorMessage}`, { error: err });
            throw err;
        }
    }
```

---

### 9. `src/modules/accounts/account.controller.ts`

*(Add `updateAccountSettings` method to `AccountsController`)*:

```typescript
    public updateAccountSettings = async (
        req: Request<GetAccountDetailsSchema, object, UpdateAccountSettingsSchema>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const accountId = req.params.accountId;
            const response = await this.accountsService.updateAccountSettings(accountId, req.body);
            res.status(200).send(response);
        } catch (error) {
            next(error);
        }
    };
```

---

### 10. `src/modules/accounts/account.routes.ts`

```typescript
import { Router } from 'express';

import { authMiddleware, validate } from '@middlewares';
import { handleRequest } from 'shared/utils/index.js';
import { AccountsController } from './account.controller.js';
import {
    connectAccountSchema,
    deleteAccountSchema,
    enableAccountSchema,
    getAccountDetailsSchema,
    updateAccountSettingsSchema,
} from './account.schema.js';

const router = Router();

const accountsController = new AccountsController();

router.get('/callback/:provider', validate({ params: connectAccountSchema }), handleRequest(accountsController.callback));

router.use(authMiddleware);

router.get('/sync-all', handleRequest(accountsController.syncAccounts));

router.get('/sync/:accountId', handleRequest(accountsController.syncAccount));

router.get('/:accountId', validate({ params: getAccountDetailsSchema }), handleRequest(accountsController.getAccountDetails));

router.delete('/:accountId', validate({ params: deleteAccountSchema }), handleRequest(accountsController.deleteAccount));

router.get('/list/all', handleRequest(accountsController.getAccounts));

router.get('/providers/list', handleRequest(accountsController.getAccountProviders));

router.get('/connect/:provider', validate({ params: connectAccountSchema }), handleRequest(accountsController.connect));

router.patch(
    '/enable/:accountId',
    validate({ params: getAccountDetailsSchema, body: enableAccountSchema }),
    handleRequest(accountsController.enableAccount),
);

router.patch(
    '/settings/:accountId',
    validate({ params: getAccountDetailsSchema, body: updateAccountSettingsSchema }),
    handleRequest(accountsController.updateAccountSettings),
);

export default router;
```

---

### 11. `src/core/queue/scheduler.service.ts`

```typescript
import { AccountRepository } from '@modules/accounts/account.repository.js';
import { User } from '@modules/user/user.model.js';
import { logger } from '@utils';
import { QUEUE_NAMES } from './queue.config.js';
import { getQueue } from './queue.registry.js';

export class SchedulerService {
    /**
     * Scans database and synchronizes repeatable BullMQ jobs.
     * Recreates repeatable jobs if sync intervals change.
     */
    public static async init(): Promise<void> {
        try {
            logger.info('⏰ Syncing background schedules with MongoDB...');
            const queue = getQueue(QUEUE_NAMES.SYNC_ACCOUNT);

            const jobSchedulers = await queue.getJobSchedulers();
            const accounts = await AccountRepository.getAccounts({ active: true, syncEnabled: true });

            for (const account of accounts) {
                const dbUser = await User.findOne({ auth0UserId: account.userId });
                const globalAutoSync = dbUser?.syncSettings?.globalAutoSync ?? true;

                if (!globalAutoSync) {
                    await this.removeAccountRepeatableJob(String(account._id));
                    continue;
                }

                await this.upsertAccountRepeatableJob(String(account._id));
            }
            logger.info('⏰ Background schedules synchronized successfully');
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`❌ Failed to sync repeatable schedulers: ${msg}`, { error });
            throw error;
        }
    }

    /**
     * Dynamic upsert when an account triggers activation or updates intervals
     */
    public static async upsertAccountRepeatableJob(accountId: string): Promise<void> {
        try {
            const account = await AccountRepository.getAccountById(accountId);
            if (!account || !account.active || !account.syncEnabled) {
                await this.removeAccountRepeatableJob(accountId);
                return;
            }

            const dbUser = await User.findOne({ auth0UserId: account.userId });
            const globalAutoSync = dbUser?.syncSettings?.globalAutoSync ?? true;
            if (!globalAutoSync) {
                await this.removeAccountRepeatableJob(accountId);
                return;
            }

            const queue = getQueue(QUEUE_NAMES.SYNC_ACCOUNT);
            const jobSchedulers = await queue.getJobSchedulers();
            
            let intervalMinutes = account.syncInterval;
            if (dbUser?.syncSettings?.syncMode === 'SAME_FOR_ALL' && dbUser.syncSettings.globalSyncInterval) {
                intervalMinutes = dbUser.syncSettings.globalSyncInterval;
            }

            const intervalMs = intervalMinutes * 60 * 1000;

            for (const scheduler of jobSchedulers) {
                if (!scheduler.name.startsWith('sync:')) {
                    continue;
                }
                const rAccountId = scheduler.name.replace('sync:', '');
                if (rAccountId === accountId && scheduler.every !== intervalMs) {
                    await queue.removeJobScheduler(scheduler.key);
                }
            }

            logger.info(`⏰ Registering/Updating repeatable sync: ${accountId} (Every ${intervalMinutes} mins)`);
            await queue.add(
                `sync:${accountId}`,
                { accountId, userId: account.userId, force: false },
                {
                    repeat: { every: intervalMs },
                    jobId: `repeat:${accountId}`,
                    priority: 2,
                },
            );
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`❌ Failed to upsert repeatable job: ${msg}`, { error, accountId });
            throw error;
        }
    }

    /**
     * Remove repeatable jobs when deactivated/deleted
     */
    public static async removeAccountRepeatableJob(accountId: string): Promise<void> {
        try {
            const queue = getQueue(QUEUE_NAMES.SYNC_ACCOUNT);
            const jobSchedulers = await queue.getJobSchedulers();

            for (const scheduler of jobSchedulers) {
                if (!scheduler.name.startsWith('sync:')) {
                    continue;
                }
                const rAccountId = scheduler.name.replace('sync:', '');
                if (rAccountId === accountId) {
                    logger.info(`⏰ Deleting repeatable sync schedule: ${accountId}`);
                    await queue.removeJobScheduler(scheduler.key);
                }
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`❌ Failed to delete repeatable sync job: ${msg}`, { error, accountId });
            throw error;
        }
    }

    /**
     * Remove all repeatable sync jobs belonging to a specific user
     */
    public static async removeAllUserRepeatableJobs(userId: string): Promise<void> {
        try {
            const accounts = await AccountRepository.getAccounts({ userId });
            for (const account of accounts) {
                await this.removeAccountRepeatableJob(String(account._id));
            }
            logger.info(`⏰ Removed all repeatable sync jobs for user: ${userId}`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error(`❌ Failed to remove user repeatable jobs: ${msg}`, { error, userId });
            throw error;
        }
    }
}
```

---

## Verification Plan

### Automated Tests
1. Run TypeScript build verification:
   ```bash
   pnpm tsc --noEmit
   ```
2. Run ESLint checks across backend:
   ```bash
   pnpm lint
   ```

### Manual API Verification
1. **User Global Settings Endpoints**:
   - `GET /api/user/sync-settings`: Verify HTTP 200 response with initial `UserSyncSettings` payload.
   - `PATCH /api/user/sync-settings`: Send `{ globalAutoSync: false }` -> Verify HTTP 200 and check BullMQ job schedulers are removed via `getJobSchedulers()`.
   - `PATCH /api/user/sync-settings`: Send `{ syncMode: "SAME_FOR_ALL", globalSyncInterval: 10 }` -> Verify all user account records in MongoDB update `syncInterval` to 10 and BullMQ schedules re-initialize to 10 minutes (600,000 ms).
2. **Account Quick & Specific Settings Endpoint**:
   - `PATCH /api/accounts/settings/:accountId`: Send `{ syncInterval: 30, syncEnabled: true }` -> Verify MongoDB record updates and BullMQ repeatable schedule is updated to 30 minutes (1,800,000 ms).
