# Frontend Background Sync - Phase 1 Implementation Plan

This document details the step-by-step implementation for **Phase 1: Backend Settings Schemas & Dynamic Schedulers** of the MailSense Frontend Background Sync system.

---

## Goal Description

Establish the core backend foundation for managing sync settings at both the user level (global settings) and the account level (per-account settings). This phase extends the MongoDB database with a `UserSettings` model (`UserSettingsModel`), exposes API endpoints to retrieve and update user global sync settings as well as individual account settings, and updates the `SchedulerService` in BullMQ to handle dynamic schedule updates, bulk rescheduling (`SAME_FOR_ALL` mode), and global pause (`globalAutoSync: false`).

---

## User Review Required

> [!IMPORTANT]
> **Backend API Alignment & BullMQ Job Rescheduling**
>
> - User global settings default to `globalAutoSync: true`, `syncMode: 'CUSTOM_PER_ACCOUNT'`, `globalSyncInterval: 15` (minutes), and `defaultSyncInterval: 15` (minutes).
> - Toggling `globalAutoSync: false` invokes `SchedulerService.removeAllUserRepeatableJobs(userId)` which cancels all active BullMQ repeatable sync timers for that user without removing the connected accounts from MongoDB.
> - Setting `syncMode: 'SAME_FOR_ALL'` bulk updates all accounts belonging to the user to use the `globalSyncInterval` and updates their BullMQ repeatable schedules accordingly.

---

## Completed & Verified Changes

### Component: Shared Types (`@mailsense/types`)

#### [MODIFY] [common.interfaces.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense-types/src/common/common.interfaces.ts)

- Made `createdAt` and `updatedAt` optional (`createdAt?: Date | string | undefined`, `updatedAt?: Date | string | undefined`) in `BaseEntity` so projected MongoDB queries or DTOs (e.g. `EmailListDTO`) that omit timestamp fields compile cleanly.

---

### Component: Backend User Module (`src/modules/user/`)

#### [MODIFY] [user.types.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user.types.ts)

- Re-export `UserSettings`, `UserAccountSettings`, `UserAccountSyncSettings`, and `ACCOUNT_SYNC_MODE` enum from `@mailsense/types`.

#### [MODIFY] [user.model.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user.model.ts)

- Import `ACCOUNT_SYNC_MODE`, `CreateEntityInput`, `UserAccountSettings`, `UserAccountSyncSettings`, and `UserSettings` from `@mailsense/types`.
- Add `UserSettingsDocument`, `UserSettingsInput`, `UserAccountSyncSettingsSchema`, `UserAccountSettingsSchema`, `UserSettingsSchema`, and export `UserSettingsModel` pointing to the `usersettings` collection.

#### [NEW] [user-settings.repository.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user-settings.repository.ts)

- Create `UserSettingsRepository` with static database methods: `getUserSettings`, `createUserSettings`, and `updateUserSettings`.

#### [MODIFY] [user.schema.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user.schema.ts)

- Import `ACCOUNT_SYNC_MODE` from `@mailsense/types`.
- Add `userAccountSyncSettingsSchema` and `updateUserSettingsSchema` using Zod for payload validation.

#### [MODIFY] [user.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user.service.ts)

- Import `UserSettingsRepository` from `./user-settings.repository.js`.
- Implement `getUserSettings(auth0UserId: string)` to retrieve settings or seed default values.
- Implement `updateUserSettings(auth0UserId: string, data: UserSettings)` to persist updated global settings.

#### [MODIFY] [user.controller.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user.controller.ts)

- Add `getUserSettings` and `updateUserSettings` request handler methods.

#### [MODIFY] [user.routes.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/user/user.routes.ts)

- Register `GET /settings` and `PATCH /settings` routes.

---

### Component: Backend Accounts Module (`src/modules/accounts/`)

#### [MODIFY] [account.schema.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.schema.ts)

- Add `updateAccountSettingsSchema` for validating `syncEnabled`, `syncInterval`, and `active` per-account updates.

#### [MODIFY] [account.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.service.ts)

- Add `updateAccountSettings(accountId: string, settings: UpdateAccountSettingsSchema)` to update account sync settings and re-evaluate BullMQ schedule.

#### [MODIFY] [account.controller.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.controller.ts)

- Add `updateAccountSettings` controller method.

#### [MODIFY] [account.routes.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.routes.ts)

- Register `PATCH /settings/:accountId` route.

---

### Component: Queue & Scheduler Core (`src/core/queue/`)

#### [MODIFY] [scheduler.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/core/queue/scheduler.service.ts)

- Import `UserSettingsRepository` from `@modules/user/user-settings.repository.js`.
- Update `init()` and `upsertAccountRepeatableJob()` to inspect `UserSettings` for `globalAutoSync` and `syncMode`.
- Implement `removeAccountRepeatableJob(accountId: string)` and `removeAllUserRepeatableJobs(userId: string)`.
- Fixed ESLint unused variable warning on `jobSchedulers` in `init()`.

---

## File Contents & Code Reference

Below are the key backend file implementations for Phase 1.

### 1. `src/modules/user/user-settings.repository.ts`

```typescript
import {
  UserSettingsDocument,
  UserSettingsInput,
  UserSettingsModel,
} from "./user.model.js";

export class UserSettingsRepository {
  static async getUserSettings(
    auth0UserId: string,
  ): Promise<UserSettingsDocument | null> {
    return await UserSettingsModel.findOne({ userId: auth0UserId });
  }

  static async createUserSettings(
    data: UserSettingsInput,
  ): Promise<UserSettingsDocument> {
    return await UserSettingsModel.create(data);
  }

  static async updateUserSettings(
    userId: string,
    data: UserSettingsInput,
  ): Promise<UserSettingsDocument | null> {
    return await UserSettingsModel.findOneAndUpdate({ userId }, data, {
      new: true,
    });
  }
}
```

---

### 2. `src/modules/user/user.model.ts`

```typescript
import {
  ACCOUNT_SYNC_MODE,
  CreateEntityInput,
  UserAccountSettings,
  UserAccountSyncSettings,
  UserSettings,
} from "@mailsense/types";
import { Document, model, Schema } from "mongoose";

export interface User {
  auth0UserId: string;
  name: string;
  email: string;
}

export type UserInput = CreateEntityInput<User>;

export type UserDocument = Document & User;

const UserSchema = new Schema<UserDocument>(
  {
    auth0UserId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  { timestamps: true, versionKey: false },
);

UserSchema.index({ auth0UserId: 1 }, { unique: true });

export const User = model<UserDocument>("User", UserSchema);

// User settings
export type UserSettingsInput = CreateEntityInput<UserSettings>;

export type UserSettingsDocument = Document & UserSettings;

const UserAccountSyncSettingsSchema = new Schema<UserAccountSyncSettings>(
  {
    globalAutoSync: { type: Boolean, default: true },
    syncMode: {
      type: String,
      enum: Object.values(ACCOUNT_SYNC_MODE),
      default: ACCOUNT_SYNC_MODE.CUSTOM_PER_ACCOUNT,
    },
    globalSyncInterval: { type: Number, default: 60 },
    defaultSyncInterval: { type: Number, default: 60 },
  },
  { _id: false },
);

const UserAccountSettingsSchema = new Schema<UserAccountSettings>(
  {
    syncSettings: { type: UserAccountSyncSettingsSchema, default: () => ({}) },
  },
  { _id: false },
);

const UserSettingsSchema = new Schema<UserSettingsDocument>(
  {
    userId: { type: String, required: true, index: true },
    account: { type: UserAccountSettingsSchema, default: () => ({}) },
  },
  { timestamps: true, versionKey: false },
);

UserSettingsSchema.index({ userId: 1 }, { unique: true });

export const UserSettingsModel = model<UserSettingsDocument>(
  "UserSettings",
  UserSettingsSchema,
);
```

---

### 3. `src/core/queue/scheduler.service.ts`

```typescript
import { ACCOUNT_SYNC_MODE } from "@mailsense/types";
import { AccountRepository } from "@modules/accounts/account.repository.js";
import { UserSettingsRepository } from "@modules/user/user-settings.repository.js";
import { logger } from "@utils";
import { QUEUE_NAMES } from "./queue.config.js";
import { getQueue } from "./queue.registry.js";

export class SchedulerService {
  /**
   * Scans database and synchronizes repeatable BullMQ jobs.
   * Recreates repeatable jobs if sync intervals change.
   */
  public static async init(): Promise<void> {
    try {
      logger.info("⏰ Syncing background schedules with MongoDB...");
      const accounts = await AccountRepository.getAccounts({
        active: true,
        syncEnabled: true,
      });

      for (const account of accounts) {
        const userSettingsDoc = await UserSettingsRepository.getUserSettings(
          account.userId,
        );
        const globalAutoSync =
          userSettingsDoc?.account?.syncSettings?.globalAutoSync ?? true;

        if (!globalAutoSync) {
          await this.removeAccountRepeatableJob(String(account._id));
          continue;
        }

        await this.upsertAccountRepeatableJob(String(account._id));
      }
      logger.info("⏰ Background schedules synchronized successfully");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Failed to sync repeatable schedulers: ${msg}`, {
        error,
      });
      throw error;
    }
  }

  /**
   * Dynamic upsert when an account triggers activation or updates intervals
   */
  public static async upsertAccountRepeatableJob(
    accountId: string,
  ): Promise<void> {
    try {
      const account = await AccountRepository.getAccountById(accountId);
      if (!account || !account.active || !account.syncEnabled) {
        await this.removeAccountRepeatableJob(accountId);
        return;
      }

      const userSettingsDoc = await UserSettingsRepository.getUserSettings(
        account.userId,
      );
      const syncSettings = userSettingsDoc?.account?.syncSettings;
      const globalAutoSync = syncSettings?.globalAutoSync ?? true;
      if (!globalAutoSync) {
        await this.removeAccountRepeatableJob(accountId);
        return;
      }

      const queue = getQueue(QUEUE_NAMES.SYNC_ACCOUNT);
      const jobSchedulers = await queue.getJobSchedulers();

      let intervalMinutes = account.syncInterval;
      if (
        syncSettings?.syncMode === ACCOUNT_SYNC_MODE.SAME_FOR_ALL &&
        syncSettings.globalSyncInterval
      ) {
        intervalMinutes = syncSettings.globalSyncInterval;
      }

      const intervalMs = intervalMinutes * 60 * 1000;

      for (const scheduler of jobSchedulers) {
        if (!scheduler.name.startsWith("sync:")) {
          continue;
        }
        const rAccountId = scheduler.name.replace("sync:", "");
        if (rAccountId === accountId && scheduler.every !== intervalMs) {
          await queue.removeJobScheduler(scheduler.key);
        }
      }

      logger.info(
        `⏰ Registering/Updating repeatable sync: ${accountId} (Every ${intervalMinutes} mins)`,
      );
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
      logger.error(`❌ Failed to upsert repeatable job: ${msg}`, {
        error,
        accountId,
      });
      throw error;
    }
  }

  /**
   * Remove repeatable jobs when deactivated/deleted
   */
  public static async removeAccountRepeatableJob(
    accountId: string,
  ): Promise<void> {
    try {
      const queue = getQueue(QUEUE_NAMES.SYNC_ACCOUNT);
      const jobSchedulers = await queue.getJobSchedulers();

      for (const scheduler of jobSchedulers) {
        if (!scheduler.name.startsWith("sync:")) {
          continue;
        }
        const rAccountId = scheduler.name.replace("sync:", "");
        if (rAccountId === accountId) {
          logger.info(`⏰ Deleting repeatable sync schedule: ${accountId}`);
          await queue.removeJobScheduler(scheduler.key);
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Failed to delete repeatable sync job: ${msg}`, {
        error,
        accountId,
      });
      throw error;
    }
  }

  /**
   * Remove all repeatable sync jobs belonging to a specific user
   */
  public static async removeAllUserRepeatableJobs(
    userId: string,
  ): Promise<void> {
    try {
      const accounts = await AccountRepository.getAccounts({ userId });
      for (const account of accounts) {
        await this.removeAccountRepeatableJob(String(account._id));
      }
      logger.info(`⏰ Removed all repeatable sync jobs for user: ${userId}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Failed to remove user repeatable jobs: ${msg}`, {
        error,
        userId,
      });
      throw error;
    }
  }
}
```

---

## Verification Plan

### Automated Verification

1. Build check in `@mailsense/types`:
   ```bash
   pnpm build
   ```
   _(Passed - clean build)_
2. TypeScript build check in Backend:
   ```bash
   pnpm build
   ```
   _(Passed - clean compilation)_
3. ESLint check in Backend:
   ```bash
   pnpm lint
   ```
   _(Passed - 0 errors, 0 warnings)_
