# Email Experience Completion - Phase 2 Implementation Plan

This document details the step-by-step implementation for **Phase 2: Attachments (Preview & Download Proxy)** of the MailSense Email Experience Completion system.

---

## Goal Description

Implement complete email attachment support across ingestion, database, proxy API, and UI layers. Currently, email attachments are discarded during synchronization, preventing users from viewing attachment indicators or downloading files attached to emails.

This phase uses `@mailsense/types` `v1.2.0` (`EmailAttachment`, `EmailAttributes.attachments`, `EmailListDTO.attachmentCount` as defined initially in `types-implementation-plan.md` and fully implemented/built in `@mailsense/types`), extends `EmailModel` with attachment metadata (`attachmentId`, `filename`, `mimeType`, `size`, `contentId`, `isInline`), updates Gmail and Outlook sync parsers to extract attachment headers during ingestion, implements an on-demand streaming attachment download proxy (`GET /api/emails/attachment/:emailId/:attachmentId`), and builds frontend attachment components (`AttachmentBadge` for list items and `AttachmentList` with file type icons, size formatting, image preview modals, and direct download handlers).

---

## User Review Required

> [!IMPORTANT]
> **Streaming Download Proxy & Memory Constraints**
>
> - **On-Demand Streaming:** Attachment binary data is **never** permanently stored in MongoDB or disk. When a user requests an attachment download (`GET /api/emails/attachment/:emailId/:attachmentId`), MailSense proxies the raw binary stream directly from the provider API (Gmail `messages.attachments.get` or Microsoft Graph `/me/messages/{id}/attachments/{id}/$value`) to the HTTP response stream.
> - **Memory Safety:** Streaming chunk-by-chunk enforces strict compliance with the **256MB RAM system limit** even when users download large attachments (e.g. 20MB+ PDFs or archives).
> - **Sparse Indexing:** Adds `EmailSchema.index({ accountId: 1, 'attachments.0': 1 }, { sparse: true })` to enable fast attachment filtering without indexing emails that lack attachments.

---

## Proposed Implementation Structure

### Component: Backend Email Module (`Backend/src/modules/emails/`)

#### [MODIFY] [email.model.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/emails/email.model.ts)

- Define `AttachmentSchema` subdocument.
- Add `attachments: { type: [AttachmentSchema], default: [] }` to `EmailSchema`.
- Add compound sparse index: `EmailSchema.index({ accountId: 1, 'attachments.0': 1 }, { sparse: true })`.

#### [MODIFY] [email.provider.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/integrations/email/email.provider.ts)

- Add `getAttachment(accountId: string, messageId: string, attachmentId: string): Promise<{ data: Buffer; mimeType: string; filename: string }>` to `IEmailProvider`.

#### [MODIFY] [gmail.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/integrations/gmail/gmail.service.ts) & [gmail.client.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/integrations/gmail/gmail.client.ts)

- Update message parsing logic to recursive extraction of payload parts containing `filename` and `body.attachmentId`.
- Implement `GmailClient.getAttachment` calling Gmail API `users.messages.attachments.get` and decoding Base64URL data stream.

#### [MODIFY] [outlook.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/integrations/outlook/outlook.service.ts) & [outlook.api.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/integrations/outlook/outlook.api.ts)

- Include `$expand=attachments` in Graph API message fetch queries.
- Extract attachment array items (`id`, `name`, `contentType`, `size`, `isInline`).
- Implement `OutlookApi.getAttachment` retrieving raw binary stream from Graph API `/me/messages/{id}/attachments/{id}/$value`.

#### [MODIFY] [email.service.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/emails/email.service.ts)

- Implement `downloadAttachment(emailId: string, attachmentId: string)`:
  1. Fetch `Email` document by `emailId`.
  2. Locate target attachment item in `email.attachments`.
  3. Obtain provider adapter via `EmailProviderFactory.getProvider(email.accountId)`.
  4. Call `provider.getAttachment(email.accountId, email.providerMessageId, attachmentId)`.
  5. Return binary payload, MIME type, and filename.

#### [MODIFY] [email.controller.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/emails/email.controller.ts)

- Implement `downloadAttachment` handler:
  - Extracts `emailId` and `attachmentId` from `req.params`.
  - Sets HTTP headers `Content-Type` and `Content-Disposition: attachment; filename="..."`.
  - Sends binary data stream to HTTP response.

#### [MODIFY] [email.routes.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense/Backend/src/modules/emails/email.routes.ts)

- Register route: `router.get('/attachment/:emailId/:attachmentId', handleRequest(emailController.downloadAttachment))`.

---

### Component: Frontend Email Feature (`Frontend/src/features/emails/`)

#### [NEW] [AttachmentBadge.tsx](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/emails/components/AttachmentBadge.tsx)

- Compact list item component:
  - Renders paperclip icon `📎` and count badge when `attachmentCount > 0`.

#### [NEW] [AttachmentList.tsx](file:///Users/vishaljagamani/Projects/Projects/mailsense/Frontend/src/features/emails/components/AttachmentList.tsx)

- Interactive attachment grid component for detail and thread views:
  - Formats file size in readable units (B, KB, MB).
  - Renders specific icons based on MIME type (Image, PDF, Archive, Document, Code, Audio, Video).
  - Provides direct download trigger calling backend proxy URL.
  - Features an inline image modal preview for image attachments (`image/*`).

---

## Low-Level Design & Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Frontend (AttachmentList / ThreadView)
    participant Ctrl as EmailController
    participant Svc as EmailService
    participant Repo as EmailRepository
    participant Factory as EmailProviderFactory
    participant Provider as Gmail / Outlook Adapter
    participant ExternalAPI as Provider API (Gmail / Graph)

    User->>UI: Click Attachment Download Chip
    UI->>Ctrl: GET /api/emails/attachment/:emailId/:attachmentId (Bearer Auth)
    Ctrl->>Svc: downloadAttachment(emailId, attachmentId)
    Svc->>Repo: getEmail(emailId)
    Repo-->>Svc: EmailDocument (contains accountId, providerMessageId, attachments[])

    Svc->>Svc: Find matching attachment metadata in attachments[]
    alt Attachment Metadata Not Found
        Svc-->>Ctrl: Throw 404 AttachmentNotFound
        Ctrl-->>UI: 404 Not Found
    else Attachment Found
        Svc->>Factory: getProvider(email.accountId)
        Factory-->>Svc: IEmailProvider Instance
        Svc->>Provider: getAttachment(accountId, providerMessageId, attachmentId)
        Provider->>ExternalAPI: GET attachment endpoint (messages.attachments.get / $value)
        ExternalAPI-->>Provider: Raw Binary Stream / Base64 Data
        Provider-->>Svc: { data: Buffer/Stream, mimeType, filename }
        Svc-->>Ctrl: AttachmentResult
        Ctrl->>Ctrl: Set HTTP Header Content-Type = mimeType
        Ctrl->>Ctrl: Set HTTP Header Content-Disposition = attachment; filename="filename"
        Ctrl-->>UI: 200 OK (Binary Data Stream Payload)
        UI->>User: Browser Triggers Direct File Download
    end
```

---

## Step-by-Step Task Breakdown

- [ ] **Task 1: Backend Mongoose Schema & Indexes**
  - Define `AttachmentSchema` in `email.model.ts` using types imported directly from `@mailsense/types`.
  - Add `attachments` array and sparse index `EmailSchema.index({ accountId: 1, 'attachments.0': 1 }, { sparse: true })`.
- [ ] **Task 2: Provider Ingestion Parsers**
  - Update `GmailService` message parser to extract recursive MIME parts.
  - Update `OutlookService` message parser to expand attachments collection.
- [ ] **Task 3: Provider Download Implementation**
  - Add `getAttachment` signature to `IEmailProvider`.
  - Implement `GmailClient.getAttachment` and `OutlookApi.getAttachment`.
- [ ] **Task 4: Backend Service & Controller Proxy**
  - Add `downloadAttachment` to `EmailService` and `EmailController`.
  - Set content disposition and MIME type headers for stream response.
- [ ] **Task 5: Route Registration**
  - Register `GET /attachment/:emailId/:attachmentId` in `email.routes.ts`.
- [ ] **Task 6: Frontend Attachment Components**
  - Create `Frontend/src/features/emails/components/AttachmentBadge.tsx`.
  - Create `Frontend/src/features/emails/components/AttachmentList.tsx` with file icons, size formatters, image modal, and download trigger.
- [ ] **Task 7: UI Integration**
  - Add `AttachmentBadge` to inbox email list items.
  - Add `AttachmentList` to email detail view and `Frontend/src/features/emails/components/thread-view/index.tsx`.
- [ ] **Task 8: Verification**
  - Typecheck packages and test attachment ingestion + download flow.

---

## File Contents & Code Reference

### 1. `Backend/src/modules/emails/email.model.ts` (Schema Updates)

```typescript
import { EmailAttachment, EmailAttributes } from "@mailsense/types";
import { Document, model, Schema } from "mongoose";

export type EmailInput = Omit<
  EmailAttributes,
  "_id" | "createdAt" | "updatedAt"
>;
export type EmailDocument = Document & EmailAttributes;

const AttachmentSchema = new Schema<EmailAttachment>(
  {
    attachmentId: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    contentId: { type: String, required: false },
    isInline: { type: Boolean, default: false },
  },
  { _id: false },
);

const EmailSchema = new Schema<EmailDocument>(
  {
    accountId: { type: String, required: true },
    providerMessageId: { type: String, required: true },
    threadId: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: [String], required: true },
    cc: { type: [String], required: true },
    bcc: { type: [String], required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    bodyHtml: { type: String, required: true },
    bodyPlain: { type: String, required: true },
    receivedAt: { type: Date, required: true },
    isRead: { type: Boolean, required: true },
    folders: { type: [String], required: true },
    attachments: { type: [AttachmentSchema], default: [] },
  },
  { timestamps: true, versionKey: false },
);

// Indexes
EmailSchema.index({ accountId: 1, providerMessageId: 1 }, { unique: true });
EmailSchema.index({ accountId: 1, receivedAt: -1 });
EmailSchema.index({ accountId: 1, folders: 1, receivedAt: -1 });
EmailSchema.index({ accountId: 1, "attachments.0": 1 }, { sparse: true });

export const Email = model<EmailDocument>("Email", EmailSchema);
```

---

### 2. `Backend/src/modules/emails/email.service.ts` (`downloadAttachment` Method)

```typescript
export class EmailService {
  // ... existing methods ...

  /**
   * Downloads an email attachment via provider proxy stream
   */
  public async downloadAttachment(
    emailId: string,
    attachmentId: string,
  ): Promise<{ data: Buffer; mimeType: string; filename: string }> {
    const email = await EmailRepository.getEmail(emailId);
    if (!email) {
      throw new Error("Email not found");
    }

    const attachment = (email.attachments || []).find(
      (att) => att.attachmentId === attachmentId,
    );
    if (!attachment) {
      throw new Error("Attachment not found");
    }

    const provider = EmailProviderFactory.getProvider(email.accountId);
    const result = await provider.getAttachment(
      email.accountId,
      email.providerMessageId,
      attachmentId,
    );

    return {
      data: result.data,
      mimeType: attachment.mimeType || "application/octet-stream",
      filename: attachment.filename || "attachment",
    };
  }
}
```

---

### 3. `Backend/src/modules/emails/email.controller.ts` (`downloadAttachment` Handler)

```typescript
export class EmailController {
  // ... existing handlers ...

  public downloadAttachment = async (
    req: Request<{ emailId: string; attachmentId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { emailId, attachmentId } = req.params;
      if (!emailId || !attachmentId) {
        throw new Error("Email ID and Attachment ID are required");
      }

      const result = await this.emailService.downloadAttachment(
        emailId,
        attachmentId,
      );

      res.setHeader("Content-Type", result.mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(result.filename)}"`,
      );
      res.send(result.data);
    } catch (error) {
      next(error);
    }
  };
}
```

---

### 4. `Frontend/src/features/emails/components/AttachmentBadge.tsx`

```tsx
import React from "react";
import { Paperclip } from "lucide-react";

interface AttachmentBadgeProps {
  count?: number;
}

export const AttachmentBadge: React.FC<AttachmentBadgeProps> = ({ count }) => {
  if (!count || count <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
      <Paperclip className="w-3 h-3 text-gray-400" />
      <span className="font-medium">{count}</span>
    </span>
  );
};
```

---

### 5. `Frontend/src/features/emails/components/AttachmentList.tsx`

```tsx
import React, { useState } from "react";
import { EmailAttachment } from "@mailsense/types";
import {
  Download,
  FileText,
  Image as ImageIcon,
  FileArchive,
  FileCode,
  Film,
  Music,
  Eye,
  X,
} from "lucide-react";

interface AttachmentListProps {
  emailId: string;
  attachments: EmailAttachment[];
}

export const AttachmentList: React.FC<AttachmentListProps> = ({
  emailId,
  attachments,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/"))
      return <ImageIcon className="w-4 h-4 text-blue-500" />;
    if (
      mimeType.includes("pdf") ||
      mimeType.includes("word") ||
      mimeType.includes("text")
    )
      return <FileText className="w-4 h-4 text-red-500" />;
    if (
      mimeType.includes("zip") ||
      mimeType.includes("tar") ||
      mimeType.includes("rar")
    )
      return <FileArchive className="w-4 h-4 text-amber-500" />;
    if (
      mimeType.includes("json") ||
      mimeType.includes("javascript") ||
      mimeType.includes("html")
    )
      return <FileCode className="w-4 h-4 text-emerald-500" />;
    if (mimeType.startsWith("video/"))
      return <Film className="w-4 h-4 text-purple-500" />;
    if (mimeType.startsWith("audio/"))
      return <Music className="w-4 h-4 text-pink-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const getDownloadUrl = (attId: string) => {
    return `/api/emails/attachment/${emailId}/${attId}`;
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Attachments ({attachments.length})
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {attachments.map((att) => {
          const isImage = att.mimeType.startsWith("image/");
          const downloadUrl = getDownloadUrl(att.attachmentId);

          return (
            <div
              key={att.attachmentId}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 hover:bg-gray-100/60 dark:hover:bg-gray-800 transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {getFileIcon(att.mimeType)}
                <div className="flex flex-col min-w-0 flex-1">
                  <span
                    className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate"
                    title={att.filename}
                  >
                    {att.filename}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {formatBytes(att.size)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 ml-2">
                {isImage && (
                  <button
                    onClick={() => setPreviewUrl(downloadUrl)}
                    className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                    title="Preview Image"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
                <a
                  href={downloadUrl}
                  download={att.filename}
                  className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewUrl}
              alt="Attachment Preview"
              className="max-w-full max-h-[85vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## Verification Plan

### Automated Verification

1. Typecheck shared types & Backend:

   ```bash
   cd /Users/vishaljagamani/Projects/Projects/mailsense-types && pnpm build
   cd /Users/vishaljagamani/Projects/Projects/mailsense/Backend && pnpm build
   ```

2. Typecheck Frontend:

   ```bash
   cd /Users/vishaljagamani/Projects/Projects/mailsense/Frontend && pnpm build
   ```

3. Run Backend test suite:
   ```bash
   cd /Users/vishaljagamani/Projects/Projects/mailsense/Backend && pnpm test
   ```

### Manual Verification Checklist

- [ ] Sync account with incoming attachment emails $\rightarrow$ verify `attachments` array populated in MongoDB.
- [ ] View inbox email list $\rightarrow$ verify paperclip `AttachmentBadge` appears with correct attachment count.
- [ ] View email detail / thread $\rightarrow$ verify `AttachmentList` renders chips with formatted file sizes (KB/MB) and file icons.
- [ ] Click Image preview icon $\rightarrow$ verify inline modal opens image preview cleanly.
- [ ] Click Download button $\rightarrow$ verify browser downloads original binary file with correct filename and MIME type.
