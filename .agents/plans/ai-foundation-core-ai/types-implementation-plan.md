# AI Foundation & Core AI (Gemini) Types — Overview & Contract Changes

> **Target Version:** `@mailsense/types` `v1.5.0`
> **Status:** DRAFT
> **Last Updated:** 2026-09-14

---

## 1. Overview

### Problem Statement

The MailSense email platform is expanding from traditional aggregation to an intelligent, AI-augmented email platform. In Phase 4, the backend will integrate Google Gemini via `@google/genai` to deliver:
1. **Smart Categorization** (Work, Personal, Finance, Social, Promotions, Updates)
2. **Priority Scoring** (Critical, High, Normal, Low)
3. **Email Summarization** (One-line preview and on-demand comprehensive summary)
4. **Suggested Replies** (Contextual quick replies)
5. **AI Privacy & Settings** (Global and per-account AI toggles, consent controls)

Currently, the shared `@mailsense/types` package lacks domain enums, data contracts, and request/response DTOs for AI metadata, AI background job payloads, AI settings schemas, and AI endpoints. Without these strictly typed contracts, backend workers, repositories, controllers, and frontend React Query hooks cannot interoperate with compiler-enforced safety, risking regressions, runtime contract mismatches, or `any`/`unknown` escapes.

### Goals

- Introduce centralized domain enums: `EMAIL_AI_CATEGORY`, `EMAIL_AI_PRIORITY`, and `AI_FEATURE_KEY`.
- Extend `EmailAttributes` and `EmailListDTO` with AI metadata fields (`aiCategory`, `aiPriority`, `aiSummary`, `aiTags`, `aiProcessedAt`).
- Define BullMQ queue job payload contracts: `AIProcessingJobPayload` and `AIProcessingJobResult`.
- Define User AI Settings data contracts: `UserAISettings`, `UserAIAccountSettings`, and update `UserSettings`.
- Define on-demand AI endpoint request and response DTOs:
  - Summarization: `GetEmailSummaryResponse`
  - Suggested Replies: `GetSuggestedRepliesResponse`, `GenerateRepliesRequestBody`
  - AI Settings: `UpdateUserAISettingsRequestBody`, `GetUserAISettingsResponse`
- Enforce strict type safety: zero usage of `any`, `never`, or `unknown`, and no inline object types with 3 or more properties.

---

## 2. Types to Add & Modify

### 2.1 Component: `src/emails/emails.enums.ts`

#### [NEW] `EMAIL_AI_CATEGORY` (Phases 1 & 2)

```typescript
// AI Smart Categorization domain classification
export enum EMAIL_AI_CATEGORY {
    WORK = 'work',
    PERSONAL = 'personal',
    FINANCE = 'finance',
    SOCIAL = 'social',
    PROMOTIONS = 'promotions',
    UPDATES = 'updates',
    GENERAL = 'general',
}
```

#### [NEW] `EMAIL_AI_PRIORITY` (Phases 1 & 3)

```typescript
// AI Priority Scoring levels for inbox triage
export enum EMAIL_AI_PRIORITY {
    CRITICAL = 'critical',
    HIGH = 'high',
    NORMAL = 'normal',
    LOW = 'low',
}
```

---

### 2.2 Component: `src/emails/emails.interfaces.ts`

#### [NEW] `EmailAiMetadata` (Phases 1, 2, 3, 4)

```typescript
import { EMAIL_AI_CATEGORY, EMAIL_AI_PRIORITY } from './emails.enums.js';

// Structured AI analysis metadata for an email
export interface EmailAiMetadata {
    category: EMAIL_AI_CATEGORY;
    priority: EMAIL_AI_PRIORITY;
    summary: string;
    tags: string[];
    confidence: number;
    processedAt: number;
}
```

#### [MODIFY] `EmailAttributes` (Phases 1, 2, 3, 4)

```typescript
import { BaseEntity, DATE_RANGE, Filter } from '../common/index.js';
import { EMAIL_AI_CATEGORY, EMAIL_AI_PRIORITY } from './emails.enums.js';

// DB entities
export interface EmailAttributes extends BaseEntity {
    accountId: string;
    providerMessageId: string;
    threadId: string;
    threadCount?: number;
    from: string;
    to: string[] | string;
    cc: string[] | string;
    bcc: string[] | string;
    subject: string;
    body: string;
    bodyHtml: string;
    bodyPlain: string;
    receivedAt: Date;
    isRead: boolean;
    folders: string[];
    attachments?: EmailAttachment[];
    // Phase 4: AI Foundation additions
    aiCategory?: EMAIL_AI_CATEGORY;
    aiPriority?: EMAIL_AI_PRIORITY;
    aiSummary?: string;
    aiTags?: string[];
    aiProcessedAt?: Date;
}
```

#### [MODIFY] `EmailListDTO` (Phases 2, 3, 4)

```typescript
// Lightweight Email summary DTO for list views
export interface EmailListDTO extends BaseEntity {
    subject?: string | undefined;
    from?: string | undefined;
    receivedAt?: Date | undefined;
    isRead?: boolean | undefined;
    providerMessageId?: string | undefined;
    accountId?: string | undefined;
    threadId?: string | undefined;
    threadCount?: number | undefined;
    attachmentCount?: number | undefined;
    body?: string | undefined;
    bodyHtml?: string | undefined;
    bodyPlain?: string | undefined;
    // Phase 4: AI metadata for list views
    aiCategory?: EMAIL_AI_CATEGORY | undefined;
    aiPriority?: EMAIL_AI_PRIORITY | undefined;
    aiSummary?: string | undefined;
}
```

#### [MODIFY] `GetAllEmailsFilters` (Phases 2 & 3)

```typescript
// Query filter parameters for email retrieval
export interface GetAllEmailsFilters {
    searchText?: string | undefined;
    accountId?: string[] | undefined;
    dateRange?: DATE_RANGE | undefined;
    folders?: string[] | undefined;
    unread?: boolean | undefined;
    // Phase 4: AI filtering
    aiCategory?: EMAIL_AI_CATEGORY | undefined;
    aiPriority?: EMAIL_AI_PRIORITY | undefined;
}
```

#### [NEW] `GetEmailSummaryResponse` (Phase 4)

```typescript
// Response payload for on-demand email/thread summarization
export interface GetEmailSummaryResponse {
    emailId: string;
    summary: string;
    keyPoints: string[];
    generatedAt: number;
}
```

#### [NEW] `SuggestedReplyItem` (Phase 5)

```typescript
// Individual suggested reply option
export interface SuggestedReplyItem {
    id: string;
    title: string;
    body: string;
    tone: 'formal' | 'casual' | 'concise';
}
```

#### [NEW] `GetSuggestedRepliesResponse` (Phase 5)

```typescript
// Response payload for contextual quick replies
export interface GetSuggestedRepliesResponse {
    emailId: string;
    suggestions: SuggestedReplyItem[];
    generatedAt: number;
}
```

---

### 2.3 Component: `src/user/user.enums.ts`

#### [NEW] `AI_FEATURE_KEY` (Phase 6)

```typescript
// Specific AI feature toggles
export enum AI_FEATURE_KEY {
    CATEGORIZATION = 'categorization',
    PRIORITY_SCORING = 'priorityScoring',
    SUMMARIZATION = 'summarization',
    SUGGESTED_REPLIES = 'suggestedReplies',
}
```

---

### 2.4 Component: `src/user/user.interfaces.ts`

#### [NEW] `UserAIAccountSettings` (Phase 6)

```typescript
// Per-account AI processing configuration
export interface UserAIAccountSettings {
    accountId: string;
    enabled: boolean;
}
```

#### [NEW] `UserAISettings` (Phase 6)

```typescript
// Global and granular user AI preferences
export interface UserAISettings {
    enabled: boolean;
    categorizationEnabled: boolean;
    priorityScoringEnabled: boolean;
    summarizationEnabled: boolean;
    suggestedRepliesEnabled: boolean;
    consentGivenAt?: number;
    accountOverrides: Record<string, boolean>;
}
```

#### [MODIFY] `UserSettings` (Phase 6)

```typescript
import { BaseEntity } from '../common/common.interfaces.js';
import { UserAccountSettings } from './user.interfaces.js';

export interface UserSettings extends BaseEntity {
    userId: string;
    account: UserAccountSettings;
    // Phase 4: AI configuration
    ai: UserAISettings;
}
```

#### [NEW] `UpdateUserAISettingsRequestBody` (Phase 6)

```typescript
// Request payload for updating AI user preferences
export interface UpdateUserAISettingsRequestBody {
    enabled?: boolean;
    categorizationEnabled?: boolean;
    priorityScoringEnabled?: boolean;
    summarizationEnabled?: boolean;
    suggestedRepliesEnabled?: boolean;
    accountOverrides?: Record<string, boolean>;
}
```

#### [NEW] `GetUserAISettingsResponse` (Phase 6)

```typescript
// Response envelope for user AI settings retrieval
export interface GetUserAISettingsResponse {
    settings: UserAISettings;
    globalFeatureFlag: boolean;
}
```

---

### 2.5 Component: `src/workers/workers.interfaces.ts`

#### [NEW] `AIProcessingJobPayload` (Phase 1)

```typescript
// Payload for AI processing background BullMQ job
export interface AIProcessingJobPayload {
    emailId: string;
    accountId: string;
    userId: string;
    providerMessageId: string;
    forceReprocess?: boolean;
}
```

#### [NEW] `AIProcessingJobResult` (Phase 1)

```typescript
import { EMAIL_AI_CATEGORY, EMAIL_AI_PRIORITY } from '../emails/emails.enums.js';

// Result returned upon completion of AI processing job
export interface AIProcessingJobResult {
    emailId: string;
    success: boolean;
    category?: EMAIL_AI_CATEGORY;
    priority?: EMAIL_AI_PRIORITY;
    hasSummary: boolean;
    processingDurationMs: number;
    skippedReason?: string;
}
```

---

## 3. Package Version & CHANGELOG.md Update

### Package Version

```json
"version": "1.5.0"
```

### `mailsense-types/CHANGELOG.md` Snippet

```markdown
## [1.5.0] - 2026-09-14

### Added
- `EMAIL_AI_CATEGORY` enum defining smart categorization classifications (`work`, `personal`, `finance`, `social`, `promotions`, `updates`, `general`).
- `EMAIL_AI_PRIORITY` enum defining inbox triage priority levels (`critical`, `high`, `normal`, `low`).
- `AI_FEATURE_KEY` enum defining granular feature toggles.
- `EmailAiMetadata` interface containing unified categorization, priority, summary, tags, and confidence metrics.
- `GetEmailSummaryResponse` interface for on-demand email/thread summarization endpoint.
- `SuggestedReplyItem` and `GetSuggestedRepliesResponse` interfaces for AI contextual reply suggestions.
- `UserAISettings`, `UserAIAccountSettings`, `UpdateUserAISettingsRequestBody`, and `GetUserAISettingsResponse` for AI settings and privacy management.
- `AIProcessingJobPayload` and `AIProcessingJobResult` contracts for BullMQ queue workers.

### Changed
- Extended `EmailAttributes` with optional `aiCategory`, `aiPriority`, `aiSummary`, `aiTags`, and `aiProcessedAt`.
- Extended `EmailListDTO` with `aiCategory`, `aiPriority`, and `aiSummary` for list view rendering.
- Extended `GetAllEmailsFilters` with `aiCategory` and `aiPriority` filter fields.
- Extended `UserSettings` entity with `ai: UserAISettings` configuration.
```

---

## 4. Build & Local Testing Steps

```bash
# 1. Build @mailsense/types
cd /Users/vishaljagamani/Projects/Projects/mailsense-types && pnpm build

# 2. Check types
pnpm type-check

# 3. Synchronize built artifacts with Frontend & Backend node_modules
rm -rf /Users/vishaljagamani/Projects/Projects/mailsense/Frontend/node_modules/@mailsense/types/dist
cp -r /Users/vishaljagamani/Projects/Projects/mailsense-types/dist /Users/vishaljagamani/Projects/Projects/mailsense/Frontend/node_modules/@mailsense/types/

rm -rf /Users/vishaljagamani/Projects/Projects/mailsense/Backend/node_modules/@mailsense/types/dist
cp -r /Users/vishaljagamani/Projects/Projects/mailsense-types/dist /Users/vishaljagamani/Projects/Projects/mailsense/Backend/node_modules/@mailsense/types/

# 4. Verify Downstream Type Compatibility
cd /Users/vishaljagamani/Projects/Projects/mailsense/Backend && pnpm build
cd /Users/vishaljagamani/Projects/Projects/mailsense/Frontend && npx tsc --noEmit
```
