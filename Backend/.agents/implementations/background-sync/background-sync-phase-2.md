# MailSense Background Sync System - Phase 2 Implementation Plan

This plan details the implementation of the **Provider Strategy Pattern** abstraction for Phase 2 of the asynchronous synchronization pipeline.

---

## Goal Description

Introduce a polymorphic provider strategy pattern to abstract the Gmail and Outlook services under a single interface (`IEmailProvider`). This will allow the core application services (`AccountsService`, `EmailService`, `FolderService`) and the future worker (`SyncWorker` in Phase 3) to execute synchronization and mail operations dynamically without branching on the provider type.

We will keep all external client integrations and their strategy adapters consolidated under the existing `src/integrations/` directory to adhere to clean backend architecture practices:
1. A unified generic types file `email.provider.types.ts` under `src/integrations/email/`.
2. A unified, generic `IEmailProvider<TAuthToken, TUserProfile, TSendMailResult>` interface under `src/integrations/email/`.
3. `GmailProvider` and `OutlookProvider` strategy adapters wrapping the existing service clients, strictly typing the generic parameters.
4. An `EmailProviderFactory` under `src/integrations/email/` featuring TypeScript **method overloads** to retrieve the strictly typed provider singleton statically.
5. Refactored service layers to completely decouple them from concrete Google and Microsoft integration details.

---

## User Review Required

> [!IMPORTANT]
> **Polymorphic Refactoring & Signature Unification**
> To avoid breaking downstream database updates performed inside provider adapters, we keep and wrap the exact signatures of Gmail/Outlook APIs, but unify them under common polymorphic boundaries:
> 
> * **Star vs. Flag**: In the UI, the user actions are represented as "starring" or "flagging". We unify this under `starEmails(emails, accountId, star)` on the interface. Gmail adapter delegates to Gmail `starEmails` API, while the Outlook adapter maps this to the Microsoft Graph `flagEmails` API under the hood.
> * **Mail Sending**: Unified under `sendMail(composeEmailData)`. Gmail adapter routes to `gmailService.sendMessage`, and Outlook adapter routes to `outlookService.sendMail`.
> * **Folders & Labels**: Unified under `getAllFolders`, `createFolder`, `updateFolder`, and `deleteFolder`.
> * **Message Details**: Unified under `getMessageDetails(accountId, emailId, dbEmail)`. For Gmail, which saves full email bodies on sync, we optimize by returning the decompressed database document if passed, avoiding redundant Google API calls. Outlook always does a live fetch to Graph API since delta sync doesn't fetch the full body content.

---

## Proposed Changes

### Provider Strategy Abstractions

#### [NEW] [email.provider.types.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/integrations/email/email.provider.types.ts)

Declares shared union types (`IEmailTAuthToken`, `IEmailTUserProfile`, `IEmailTSendEmailResult`) for Gmail and Outlook authentication and client schemas.

#### [MODIFY] [email.provider.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/integrations/email/email.provider.ts)

Declares the generic `IEmailProvider<TAuthToken, TUserProfile, TSendMailResult>` interface and type contracts.

#### [NEW] [gmail.provider.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/integrations/gmail/gmail.provider.ts)

Adapter class implementing `IEmailProvider` and wrapping the concrete `GmailService` client with strict Gmail typings.

#### [NEW] [outlook.provider.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/integrations/outlook/outlook.provider.ts)

Adapter class implementing `IEmailProvider` and wrapping the concrete `OutlookService` client with strict Outlook typings.

#### [NEW] [email.provider.factory.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/integrations/email/email.provider.factory.ts)

Factory manager featuring static overloads for compile-time type resolution.

---

### Core Service Refactoring

#### [MODIFY] [account.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/accounts/account.service.ts)

Refactors `callback` and merges `syncGmailAccount` / `syncOutlookAccount` into a unified polymorphic `syncAccountDetails` method utilizing the factory.

#### [MODIFY] [email.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/emails/email.service.ts)

Replaces all concrete imports of `GmailService`/`OutlookService` and conditionals with factory-obtained polymorphic calls.

#### [MODIFY] [folder.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/folders/folder.service.ts)

Replaces label-vs-folder branching logic with a clean, decoupled directory implementation using the provider strategy.

---

### Testing

#### [NEW] [provider.factory.test.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/integrations/email/__tests__/provider.factory.test.ts)

A test suite verifying factory instantiations, type safety, singleton compliance, and error boundaries for unsupported providers.

---

## File Contents

Below are the complete file contents proposed for creation or modification.

### 1. `src/integrations/email/email.provider.types.ts`

```typescript
import { GmailMessageObjectFull, GmailUserProfile } from '@integrations/gmail/gmail.types.js';
import { OutlookMessageObjectFull, OutlookUserProfile } from '@integrations/outlook/outlook.types.js';
import { EmailInput } from '@modules/emails/email.model.js';
import { GmailOAuthAccessTokenResponse, OutlookOAuthAccessTokenResponse } from '@types';

export interface EmailSyncResult {
    addedEmails: EmailInput[] | Partial<EmailInput>[];
    deletedEmailIds: string[];
    newCursor: string;
}

export type IEmailTAuthToken = GmailOAuthAccessTokenResponse | OutlookOAuthAccessTokenResponse;

export type IEmailTUserProfile = GmailUserProfile | OutlookUserProfile;

export type IEmailTSendEmailResult = Partial<GmailMessageObjectFull> | OutlookMessageObjectFull;
```

### 2. `src/integrations/email/email.provider.ts`

```typescript
import { EmailDocument, EmailInput } from '@modules/emails/email.model.js';
import { ComposeEmailBody } from '@modules/emails/email.schema.js';
import { SearchOtherContactsResponse } from '@modules/emails/email.types.js';
import { FolderInput } from '@modules/folders/folder.model.js';
import { UpdateAPIResponse } from '@types';
import { IEmailTAuthToken, IEmailTSendEmailResult, IEmailTUserProfile } from './email.provider.types.js';

export interface SyncResult {
    addedEmails: EmailInput[] | Partial<EmailInput>[];
    deletedEmailIds: string[];
    newCursor: string;
}

export interface IEmailProvider<TAuthToken = IEmailTAuthToken, TUserProfile = IEmailTUserProfile, TSendMailResult = IEmailTSendEmailResult> {
    // Auth & Profile
    getAccessTokenFromCode(code: string): Promise<TAuthToken>;
    getUserProfileFromAccessToken(accessToken: string): Promise<TUserProfile>;

    // Core Ingestion & Sync
    fetchMessages(accountId: string, cursor?: string): Promise<SyncResult | null>;

    // Email Operations
    getMessageDetails(accountId: string, emailId: string, dbEmail?: EmailDocument): Promise<EmailInput>;
    deleteEmails(emailIds: string[], accountId: string, trash?: boolean): Promise<void>;
    archiveEmails(emailIds: string[], accountId: string, archive: boolean): Promise<void>;
    unreadEmails(emailIds: string[], accountId: string, unread: boolean): Promise<void>;
    starEmails(emails: { id: string; providerMessageId: string }[], accountId: string, star: boolean): Promise<void>;
    sendMail(composeEmailData: ComposeEmailBody): Promise<TSendMailResult>;
    searchContacts(accountId: string, searchText: string): Promise<SearchOtherContactsResponse[]>;

    // Folder/Label Operations
    getAllFolders(accountId: string, userId: string): Promise<Partial<FolderInput>[]>;
    createFolder(userId: string, accountId: string, folderName: string): Promise<UpdateAPIResponse>;
    updateFolder(accountId: string, folderId: string, folderName: string): Promise<UpdateAPIResponse>;
    deleteFolder(accountId: string, folderId: string): Promise<UpdateAPIResponse>;
}
```

### 3. `src/integrations/gmail/gmail.provider.ts`

```typescript
import { IEmailProvider, SyncResult } from '@integrations/email/email.provider.js';
import { EmailDocument, EmailInput } from '@modules/emails/email.model.js';
import { ComposeEmailBody } from '@modules/emails/email.schema.js';
import { SearchOtherContactsResponse } from '@modules/emails/email.types.js';
import { FolderInput } from '@modules/folders/folder.model.js';
import { GmailOAuthAccessTokenResponse, UpdateAPIResponse } from '@types';
import { decompressString } from '@utils';
import { GmailService } from './gmail.service.js';
import { GmailMessageObjectFull, GmailUserProfile } from './gmail.types.js';

export class GmailProvider implements IEmailProvider<GmailOAuthAccessTokenResponse, GmailUserProfile, Partial<GmailMessageObjectFull>> {
    private gmailService: GmailService;

    constructor() {
        this.gmailService = new GmailService();
    }

    async getAccessTokenFromCode(code: string): Promise<GmailOAuthAccessTokenResponse> {
        return this.gmailService.getAccessTokenFromCode(code);
    }

    async getUserProfileFromAccessToken(accessToken: string): Promise<GmailUserProfile> {
        return this.gmailService.getUserProfileFromAccessToken(accessToken);
    }

    async fetchMessages(accountId: string, cursor?: string): Promise<SyncResult | null> {
        if (cursor) {
            const historyDetails = await this.gmailService.getMessagesAfterLastHistory(accountId, cursor);
            if (!historyDetails) return null;
            return {
                addedEmails: historyDetails.addedMessages,
                deletedEmailIds: historyDetails.deletedMessages,
                newCursor: historyDetails.newHistoryId,
            };
        } else {
            const result = await this.gmailService.getMessages(accountId);
            return {
                addedEmails: result.emails,
                deletedEmailIds: [],
                newCursor: result.lastSyncCursor,
            };
        }
    }

    async getMessageDetails(accountId: string, emailId: string, dbEmail?: EmailDocument): Promise<EmailInput> {
        if (dbEmail) {
            return {
                ...dbEmail.toObject(),
                bodyHtml: decompressString(dbEmail.bodyHtml),
                bodyPlain: decompressString(dbEmail.bodyPlain),
            };
        }
        const emails = await this.gmailService.getMessagesByMessagesId(accountId, [emailId]);
        if (!emails.length) {
            throw new Error(`Email details not found for message ID: ${emailId}`);
        }
        return emails[0];
    }

    async deleteEmails(emailIds: string[], accountId: string, trash?: boolean): Promise<void> {
        await this.gmailService.deleteEmails(emailIds, accountId, trash);
    }

    async archiveEmails(emailIds: string[], accountId: string, archive: boolean): Promise<void> {
        await this.gmailService.archiveEmails(emailIds, accountId, archive);
    }

    async unreadEmails(emailIds: string[], accountId: string, unread: boolean): Promise<void> {
        await this.gmailService.unreadEmails(emailIds, accountId, unread);
    }

    async starEmails(emails: { id: string; providerMessageId: string }[], accountId: string, star: boolean): Promise<void> {
        await this.gmailService.starEmails(emails, accountId, star);
    }

    async sendMail(composeEmailData: ComposeEmailBody): Promise<Partial<GmailMessageObjectFull>> {
        return this.gmailService.sendMessage(composeEmailData);
    }

    async searchContacts(accountId: string, searchText: string): Promise<SearchOtherContactsResponse[]> {
        return this.gmailService.searchContacts(accountId, searchText);
    }

    async getAllFolders(accountId: string, userId: string): Promise<Partial<FolderInput>[]> {
        return this.gmailService.getAllLabels(accountId, userId);
    }

    async createFolder(userId: string, accountId: string, folderName: string): Promise<UpdateAPIResponse> {
        return this.gmailService.createLabel(userId, accountId, folderName);
    }

    async updateFolder(accountId: string, folderId: string, folderName: string): Promise<UpdateAPIResponse> {
        return this.gmailService.updateLabel(accountId, folderId, folderName);
    }

    async deleteFolder(accountId: string, folderId: string): Promise<UpdateAPIResponse> {
        return this.gmailService.deleteLabel(accountId, folderId);
    }
}
```

### 4. `src/integrations/outlook/outlook.provider.ts`

```typescript
import { IEmailProvider, SyncResult } from '@integrations/email/email.provider.js';
import { EmailInput } from '@modules/emails/email.model.js';
import { ComposeEmailBody } from '@modules/emails/email.schema.js';
import { SearchOtherContactsResponse } from '@modules/emails/email.types.js';
import { FolderInput } from '@modules/folders/folder.model.js';
import { OutlookOAuthAccessTokenResponse, UpdateAPIResponse } from '@types';
import { OutlookService } from './outlook.service.js';
import { OutlookMessageObjectFull, OutlookUserProfile } from './outlook.types.js';

export class OutlookProvider implements IEmailProvider<OutlookOAuthAccessTokenResponse, OutlookUserProfile, OutlookMessageObjectFull> {
    private outlookService: OutlookService;

    constructor() {
        this.outlookService = new OutlookService();
    }

    async getAccessTokenFromCode(code: string): Promise<OutlookOAuthAccessTokenResponse> {
        return this.outlookService.getAccessTokenFromCode(code);
    }

    async getUserProfileFromAccessToken(accessToken: string): Promise<OutlookUserProfile> {
        return this.outlookService.getUserProfileFromAccessToken(accessToken);
    }

    async fetchMessages(accountId: string, cursor?: string): Promise<SyncResult | null> {
        if (cursor) {
            const historyDetails = await this.outlookService.getMessagesAfterLastDelta(accountId, cursor);
            if (!historyDetails) return null;
            return {
                addedEmails: historyDetails.addedEmails,
                deletedEmailIds: historyDetails.deletedEmailIds,
                newCursor: historyDetails.newDeltaLink,
            };
        } else {
            const result = await this.outlookService.getMessages(accountId);
            return {
                addedEmails: result.emails,
                deletedEmailIds: [],
                newCursor: result.deltaLink,
            };
        }
    }

    async getMessageDetails(accountId: string, emailId: string): Promise<EmailInput> {
        return this.outlookService.getMessageDetails(accountId, emailId);
    }

    async deleteEmails(emailIds: string[], accountId: string, trash?: boolean): Promise<void> {
        await this.outlookService.deleteEmails(emailIds, accountId, trash);
    }

    async archiveEmails(emailIds: string[], accountId: string, archive: boolean): Promise<void> {
        await this.outlookService.archiveEmails(emailIds, accountId, archive);
    }

    async unreadEmails(emailIds: string[], accountId: string, unread: boolean): Promise<void> {
        await this.outlookService.unreadEmails(emailIds, accountId, unread);
    }

    async starEmails(emails: { id: string; providerMessageId: string }[], accountId: string, star: boolean): Promise<void> {
        const providerMessageIds = emails.map((email) => email.providerMessageId);
        await this.outlookService.flagEmails(providerMessageIds, accountId, star);
    }

    async sendMail(composeEmailData: ComposeEmailBody): Promise<OutlookMessageObjectFull> {
        return this.outlookService.sendMail(composeEmailData);
    }

    async searchContacts(accountId: string, searchText: string): Promise<SearchOtherContactsResponse[]> {
        return this.outlookService.searchContacts(accountId, searchText);
    }

    async getAllFolders(accountId: string, userId: string): Promise<Partial<FolderInput>[]> {
        return this.outlookService.getAllFolders(accountId, userId);
    }

    async createFolder(userId: string, accountId: string, folderName: string): Promise<UpdateAPIResponse> {
        return this.outlookService.createFolder(userId, accountId, folderName, false);
    }

    async updateFolder(accountId: string, folderId: string, folderName: string): Promise<UpdateAPIResponse> {
        return this.outlookService.updateFolder(accountId, folderId, folderName);
    }

    async deleteFolder(accountId: string, folderId: string): Promise<UpdateAPIResponse> {
        return this.outlookService.deleteFolder(accountId, folderId);
    }
}
```

### 5. `src/integrations/email/email.provider.factory.ts`

```typescript
import { GmailProvider } from '@integrations/gmail/gmail.provider.js';
import { GmailMessageObjectFull, GmailUserProfile } from '@integrations/gmail/gmail.types.js';
import { OutlookProvider } from '@integrations/outlook/outlook.provider.js';
import { OutlookMessageObjectFull, OutlookUserProfile } from '@integrations/outlook/outlook.types.js';
import { AccountProvider, GmailOAuthAccessTokenResponse, OutlookOAuthAccessTokenResponse } from '@types';
import { IEmailProvider } from './email.provider.js';
import { IEmailTAuthToken, IEmailTSendEmailResult, IEmailTUserProfile } from './email.provider.types.js';

export class EmailProviderFactory {
    private static providers: Map<AccountProvider, IEmailProvider<IEmailTAuthToken, IEmailTUserProfile, IEmailTSendEmailResult>> = new Map();

    public static getProvider(
        providerType: AccountProvider.GMAIL,
    ): IEmailProvider<GmailOAuthAccessTokenResponse, GmailUserProfile, Partial<GmailMessageObjectFull>>;

    public static getProvider(
        providerType: AccountProvider.OUTLOOK,
    ): IEmailProvider<OutlookOAuthAccessTokenResponse, OutlookUserProfile, OutlookMessageObjectFull>;

    public static getProvider(providerType: AccountProvider): IEmailProvider;

    public static getProvider(providerType: AccountProvider): IEmailProvider<IEmailTAuthToken, IEmailTUserProfile, IEmailTSendEmailResult> {
        let provider = this.providers.get(providerType);
        if (!provider) {
            if (providerType === AccountProvider.GMAIL) {
                provider = new GmailProvider();
            } else if (providerType === AccountProvider.OUTLOOK) {
                provider = new OutlookProvider();
            } else {
                throw new Error(`Unsupported email provider type: ${providerType}`);
            }
            this.providers.set(providerType, provider);
        }
        return provider;
    }
}
```

### 6. `src/modules/accounts/account.service.ts` (Modifications for Polymorphism)

```typescript
import { EmailProviderFactory } from '@integrations/email/email.provider.factory.js';
// Remove direct imports: import { GmailService } from ... and import { OutlookService } from ...

export class AccountsService {
    private folderService: FolderService;

    constructor() {
        this.folderService = new FolderService();
    }

    async callback(provider: string, params: { code: string; state: string }): Promise<string> {
        try {
            const { code, state } = params;
            let userDetails;
            try {
                const decryptedState = decrypt(state);
                userDetails = JSON.parse(decryptedState);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                logger.error(`Error in AccountsService.callback: ${errorMessage}`, { error: err });
                throw err;
            }

            const emailProvider = EmailProviderFactory.getProvider(provider as AccountProvider);
            const response = await emailProvider.getAccessTokenFromCode(code);
            const { access_token, refresh_token, expires_in, scope } = response;
            const userProfile = await emailProvider.getUserProfileFromAccessToken(access_token);

            const emailAddress = 'email' in userProfile ? userProfile.email : userProfile.mail;

            const account: Partial<AccountInput> = {
                id: Date.now(),
                userId: userDetails?.id,
                provider: provider as AccountProvider,
                emailAddress,
                userProfileDetails: userProfile,
                accessToken: encrypt(access_token),
                refreshToken: encrypt(refresh_token),
                accessTokenExpiry: Date.now() + expires_in * 1000,
                refreshTokenExpiry: expires_in,
                scope,
                syncEnabled: true,
                syncInterval: 60,
                lastSyncedAt: Date.now(),
                active: true,
            };

            const savedAccount = await AccountRepository.upsertAccount(account);
            this.syncAccount(String(savedAccount._id));
            return MAILSENSE_BASE_URL;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.callback: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private async startAccountSync(accountId: string, account: AccountDocument): Promise<void> {
        try {
            await this.syncAccountDetails(accountId, account);
            await this.folderService.syncFolders(accountId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.startAccountSync: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    private async syncAccountDetails(accountId: string, account: AccountDocument): Promise<UpdateAPIResponse> {
        try {
            const emailProvider = EmailProviderFactory.getProvider(account.provider as AccountProvider);
            const historyDetails = await emailProvider.fetchMessages(accountId, account.lastSyncCursor);
            
            let newEmails: EmailInput[] | Partial<EmailInput>[] = [];
            let newCursor: string = '';
            
            if (historyDetails) {
                newEmails = historyDetails.addedEmails;
                newCursor = historyDetails.newCursor;
                await EmailRepository.deleteManyEmails(historyDetails.deletedEmailIds);
            } else {
                const fullSyncResult = await emailProvider.fetchMessages(accountId);
                if (fullSyncResult) {
                    newEmails = fullSyncResult.addedEmails;
                    newCursor = fullSyncResult.newCursor;
                }
                await EmailRepository.deleteEmailsByAccountId(accountId);
            }

            if (newEmails.length) {
                await EmailRepository.upsertEmailsInBulk(newEmails);
            }
            await this.updateAccountSyncDetails(accountId, newCursor);
            return { status: true, message: 'Account synced successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AccountsService.syncAccountDetails: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
```

### 7. `src/modules/folders/folder.service.ts` (Modifications for Polymorphism)

```typescript
import { EmailProviderFactory } from '@integrations/email/email.provider.factory.js';
// Remove direct imports: import { GmailService } from ... and import { OutlookService } from ...

export class FolderService {
    public async syncFolders(accountId: string): Promise<UpdateAPIResponse> {
        try {
            const account = await AccountRepository.getAccountById(accountId, { provider: 1, userId: 1 });
            if (!account) {
                throw new Error('Account not found');
            }
            const provider = EmailProviderFactory.getProvider(account.provider as AccountProvider);
            const folderInputs = await provider.getAllFolders(accountId, account.userId);
            await FolderRepository.addFoldersInBulk(folderInputs);
            return { status: true, message: 'Folders synced successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in FolderService.syncFolders: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async createFolder(accountId: string, folderName: string): Promise<UpdateAPIResponse> {
        try {
            const account = await AccountRepository.getAccountById(accountId, { provider: 1, userId: 1 });
            if (!account) {
                throw new Error('Account not found');
            }
            const provider = EmailProviderFactory.getProvider(account.provider as AccountProvider);
            return provider.createFolder(account.userId, accountId, folderName);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in FolderService.createFolder: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async updateFolder(accountId: string, folderId: string, folderName: string): Promise<UpdateAPIResponse> {
        try {
            const account = await AccountRepository.getAccountById(accountId, { provider: 1 });
            if (!account) {
                throw new Error('Account not found');
            }
            const provider = EmailProviderFactory.getProvider(account.provider as AccountProvider);
            return provider.updateFolder(accountId, folderId, folderName);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in FolderService.updateFolder: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async deleteFolder(folderId: string): Promise<UpdateAPIResponse> {
        try {
            const folder = await FolderRepository.getFolderByProviderFolderId(folderId);
            if (!folder) {
                throw new Error('Folder not found');
            }
            const account = await AccountRepository.getAccountById(folder.accountId, { provider: 1 });
            if (!account) {
                throw new Error('Account not found');
            }
            const provider = EmailProviderFactory.getProvider(account.provider as AccountProvider);
            return provider.deleteFolder(folder.accountId, folderId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in FolderService.deleteFolder: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
```

### 8. `src/modules/emails/email.service.ts` (Modifications for Polymorphism)

```typescript
import { EmailProviderFactory } from '@integrations/email/email.provider.factory.js';
// Remove direct imports: import { GmailService } from ... and import { OutlookService } from ...

export class EmailService {
    public async getEmail(emailId: string): Promise<EmailDocument | EmailInput | null> {
        try {
            const email = await EmailRepository.getEmail(emailId);
            if (!email) throw new Error('Email not found');
            const account = await AccountRepository.getAccountById(email.accountId, { provider: 1 });
            if (!account) throw new Error('Account not found');

            const provider = EmailProviderFactory.getProvider(account.provider as AccountProvider);
            return provider.getMessageDetails(email.accountId, email.providerMessageId, email);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.getEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async deleteEmail(emailIds: string[], trash?: boolean): Promise<UpdateAPIResponse> {
        try {
            const emailList = await EmailRepository.getEmailsByProviderMessageIds(emailIds, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            if (!emailList.length) {
                throw new Error('Email not found');
            }
            const groupedEmails = Object.groupBy(emailList, (item) => item.accountId);
            for (const [accountId, emails] of Object.entries(groupedEmails)) {
                const account = await AccountRepository.getAccountById(accountId, { provider: 1 });
                if (!account || !emails) continue;
                const provider = EmailProviderFactory.getProvider(account.provider as AccountProvider);
                await provider.deleteEmails(
                    emails.map((email) => email.providerMessageId),
                    accountId,
                    trash,
                );
            }
            return { status: true, message: 'Email deleted successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.deleteEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async archiveEmails(emailIds: string[], archive: boolean): Promise<UpdateAPIResponse> {
        try {
            const emailList = await EmailRepository.getEmailsByProviderMessageIds(emailIds, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            if (!emailList.length) {
                throw new Error('Email not found');
            }
            const groupedEmails = Object.groupBy(emailList, (item) => item.accountId);
            for (const [accountId, emails] of Object.entries(groupedEmails)) {
                const account = await AccountRepository.getAccountById(accountId, { provider: 1 });
                if (!account || !emails) continue;
                const provider = EmailProviderFactory.getProvider(account.provider as AccountProvider);
                await provider.archiveEmails(
                    emails.map((email) => email.providerMessageId),
                    accountId,
                    archive,
                );
            }
            return { status: true, message: 'Emails archived successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.archiveEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async starEmails(emailIds: string[], star: boolean): Promise<UpdateAPIResponse> {
        try {
            const emailList = await EmailRepository.getEmailsByProviderMessageIds(emailIds, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            if (!emailList.length) {
                throw new Error('Email not found');
            }
            const groupedEmails = Object.groupBy(emailList, (item) => item.accountId);
            for (const [accountId, emails] of Object.entries(groupedEmails)) {
                const account = await AccountRepository.getAccountById(accountId, { provider: 1 });
                if (!account || !emails) continue;
                const provider = EmailProviderFactory.getProvider(account.provider as AccountProvider);
                await provider.starEmails(
                    emails.map((email) => ({ id: String(email._id), providerMessageId: email.providerMessageId })),
                    accountId,
                    star,
                );
            }
            return { status: true, message: `${star ? 'Starred' : 'Unstarred'} emails successfully` };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.starEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async unreadEmails(emailIds: string[], unread: boolean): Promise<UpdateAPIResponse> {
        try {
            const emailList = await EmailRepository.getEmailsByProviderMessageIds(emailIds, EMAIL_LIST_DB_FIELD_MAPPING.LIST.projection);
            if (!emailList.length) {
                throw new Error('Email not found');
            }
            const groupedEmails = Object.groupBy(emailList, (item) => item.accountId);
            for (const [accountId, emails] of Object.entries(groupedEmails)) {
                const account = await AccountRepository.getAccountById(accountId, { provider: 1 });
                if (!account || !emails) continue;
                const provider = EmailProviderFactory.getProvider(account.provider as AccountProvider);
                await provider.unreadEmails(
                    emails.map((email) => email.providerMessageId),
                    accountId,
                    unread,
                );
            }
            return { status: true, message: 'Unread emails successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.unreadEmails: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async composeEmail(composeEmailData: ComposeEmailBody): Promise<SuccessAPIResponse> {
        try {
            const account = await AccountRepository.getAccountById(composeEmailData.accountId, { provider: 1 });
            if (!account) {
                throw new Error('Account not found');
            }
            const provider = EmailProviderFactory.getProvider(account.provider as AccountProvider);
            await provider.sendMail(composeEmailData);
            return { status: true, message: 'Email composed successfully' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.composeEmail: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    public async searchOtherContacts(userId: string, searchText: string): Promise<APIResponse<SearchOtherContactsResponse[]>> {
        try {
            const accounts = await AccountRepository.getAccounts({ userId, active: true });
            if (!accounts.length) {
                return { status: false, message: 'No accounts found', data: [] };
            }
            const contacts = accounts.map((account) => {
                const provider = EmailProviderFactory.getProvider(account.provider as AccountProvider);
                return provider.searchContacts(account._id.toString(), searchText).catch(() => []);
            });
            const results = await Promise.all(contacts);
            const allContacts = results.flat();
            const mergedContacts = allContacts.filter((contact, index, self) => index === self.findIndex((c) => c.email === contact.email));
            return { status: true, message: 'Search other contacts successfully', data: mergedContacts };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in EmailService.searchOtherContacts: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
```

### 9. `src/integrations/email/__tests__/provider.factory.test.ts`

```typescript
import { GmailProvider } from '@integrations/gmail/gmail.provider.js';
import { OutlookProvider } from '@integrations/outlook/outlook.provider.js';
import { AccountProvider } from '@types';
import { EmailProviderFactory } from '../email.provider.factory.js';

describe('EmailProviderFactory', () => {
    it('should return a GmailProvider for GMAIL type', () => {
        const provider = EmailProviderFactory.getProvider(AccountProvider.GMAIL);
        expect(provider).toBeInstanceOf(GmailProvider);
    });

    it('should return an OutlookProvider for OUTLOOK type', () => {
        const provider = EmailProviderFactory.getProvider(AccountProvider.OUTLOOK);
        expect(provider).toBeInstanceOf(OutlookProvider);
    });

    it('should return the same instance on subsequent calls (Singleton pattern)', () => {
        const provider1 = EmailProviderFactory.getProvider(AccountProvider.GMAIL);
        const provider2 = EmailProviderFactory.getProvider(AccountProvider.GMAIL);
        expect(provider1).toBe(provider2);
    });

    it('should throw an error for unsupported provider types', () => {
        expect(() => {
            EmailProviderFactory.getProvider('unsupported-provider' as AccountProvider);
        }).toThrow('Unsupported email provider type: unsupported-provider');
    });
});
```

---

## Verification Plan

### Automated Tests

- Run: `NODE_ENV=local pnpm test`
  Ensures that the entire backend test suite compiles, runs with local configuration environments, and passes successfully.

### Manual Verification

- Connect a Gmail account and Outlook account via the OAuth callback flow to verify that polymorphic authentication logic resolves user profiles correctly.
- Perform a manual sync of accounts to verify that incremental history and delta-link sync run polymorphically, and folders sync successfully.
- Perform email operations (read, delete, archive, star, unread, search contacts, compose email) to confirm all adapters route and map payloads successfully.
