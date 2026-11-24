# AI Foundation & Core Features Types — Overview & Contract Changes

> **Target Version:** `@mailsense/types` `v1.8.0`
> **Status:** COMPLETED
> **Created:** 2026-09-14 · **Last Updated:** 2026-11-24

---

## 1. Overview

### Problem Statement

The MailSense email platform is expanding from multi-account aggregation into an intelligent, AI-augmented email workspace. In Phase 4, the system will introduce a pluggable AI strategy layer (`IAiProvider`, `AiProviderFactory`, `GeminiAiProvider`, `NoopAiProvider`) to deliver:

1. **Smart Categorization** (`work`, `personal`, `finance`, `social`, `promotions`, `updates`, `general`)
2. **Priority Scoring** (`critical`, `high`, `normal`, `low`)
3. **Email & Thread Summarization** (one-line preview and on-demand comprehensive summary with action items)
4. **Contextual Suggested Replies** (2–3 tone-adapted quick replies)
5. **AI Privacy & Settings** (global toggles, per-feature toggles, per-account exclusions, and user consent tracking)

Currently, `@mailsense/types` lacks domain enums, data contracts, and request/response DTOs for AI metadata, AI background job payloads, provider strategy parameters, and AI settings schemas. Without strictly typed contracts, backend workers, repositories, controllers, and frontend React Query hooks cannot interoperate with compiler-enforced safety.

### Goals

- Introduce domain enums: `EMAIL_AI_CATEGORY`, `EMAIL_AI_PRIORITY`, `AI_FEATURE_KEY`, `AI_PROVIDER_NAME`, `SUGGESTED_REPLY_TONE`, and `AI_PROCESSING_STATUS`.
- Extend `EmailAttributes` and `EmailListDTO` with AI metadata fields (`aiCategory`, `aiPriority`, `aiSummary`, `aiTags`, `aiProcessedAt`, `aiProvider`).
- Define BullMQ queue job contracts: `AIProcessingJobPayload` and `AIProcessingJobResult`.
- Define AI provider strategy parameter and result interfaces: `AiClassifyEmailParams`, `AiClassifyEmailResult`, `AiSummarizeThreadParams`, `AiSummarizeThreadResult`, `AiSuggestedRepliesParams`, `AiSuggestedRepliesResult`.
- Define User AI Settings contracts: `UserAISettings`, `UserAIFeatureSettings`, and update `UserSettings`.
- Define on-demand AI endpoint request and response DTOs: `GetEmailSummaryResponse`, `SuggestedReplyItem`, `GetSuggestedRepliesResponse`, `UpdateUserAISettingsPayload`, `GetUserAISettingsResponse`.
- Enforce strict type safety: zero usage of `any`, `never`, or `unknown`, and strictly zero inline object types across all contract definitions.

---

## 2. Types to Add & Modify

### 2.1 Component: `src/emails/emails.enums.ts`

#### [NEW] `EMAIL_AI_CATEGORY` (Phases 1, 2, 3)

```typescript
// AI Smart Categorization domain classifications
export enum EMAIL_AI_CATEGORY {
  WORK = "work",
  PERSONAL = "personal",
  FINANCE = "finance",
  SOCIAL = "social",
  PROMOTIONS = "promotions",
  UPDATES = "updates",
  GENERAL = "general",
}
```

#### [NEW] `EMAIL_AI_PRIORITY` (Phases 1, 2, 3)

```typescript
// AI Priority Scoring levels for inbox triage
export enum EMAIL_AI_PRIORITY {
  CRITICAL = "critical",
  HIGH = "high",
  NORMAL = "normal",
  LOW = "low",
}
```

#### [NEW] `SUGGESTED_REPLY_TONE` (Phase 4)

```typescript
// Tone variants for AI-generated suggested replies
export enum SUGGESTED_REPLY_TONE {
  FORMAL = "formal",
  CASUAL = "casual",
  CONCISE = "concise",
}
```

---

### 2.2 Component: `src/ai/ai.enums.ts` (NEW MODULE)

#### [NEW] `AI_PROVIDER_NAME` (Phase 1)

```typescript
// Pluggable AI Provider strategies
export enum AI_PROVIDER_NAME {
  GEMINI = "gemini",
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  NOOP = "noop",
}
```

#### [NEW] `AI_FEATURE_KEY` (Phase 4)

```typescript
// Specific AI feature toggles
export enum AI_FEATURE_KEY {
  CATEGORIZATION = "categorization",
  PRIORITY_SCORING = "priorityScoring",
  SUMMARIZATION = "summarization",
  SUGGESTED_REPLIES = "suggestedReplies",
}
```

#### [NEW] `AI_PROCESSING_STATUS` (Phase 1)

```typescript
// Discriminated status for AI background processing job outcomes
export enum AI_PROCESSING_STATUS {
  SUCCESS = "success",
  SKIPPED = "skipped",
  FAILED = "failed",
  RATE_LIMITED = "rateLimited",
}
```

---

### 2.3 Component: `src/emails/emails.interfaces.ts`

#### [NEW] `EmailAiMetadata` (Phases 1 & 2)

```typescript
import { EMAIL_AI_CATEGORY, EMAIL_AI_PRIORITY } from "./emails.enums.js";
import { AI_PROVIDER_NAME } from "../ai/ai.enums.js";

// Structured AI analysis metadata for email documents
export interface EmailAiMetadata {
  category: EMAIL_AI_CATEGORY;
  priority: EMAIL_AI_PRIORITY;
  summary: string;
  tags: string[];
  confidence: number;
  processedAt: Date;
  provider: AI_PROVIDER_NAME;
}
```

#### [MODIFY] `EmailAttributes` (Phases 1, 2, 3)

```typescript
import { BaseEntity, DATE_RANGE, Filter } from "../common/index.js";
import { EMAIL_AI_CATEGORY, EMAIL_AI_PRIORITY } from "./emails.enums.js";
import { AI_PROVIDER_NAME } from "../ai/ai.enums.js";

// DB entities
export interface EmailAttributes extends BaseEntity {
  accountId: string;
  providerMessageId: string;
  threadId: string;
  threadCount?: number;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
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
  aiProvider?: AI_PROVIDER_NAME;
}
```

#### [MODIFY] `EmailListDTO` (Phases 2 & 5)

```typescript
// Lightweight Email summary DTO for list views
// NOTE: Additive modification only — existing fields preserved as-is from current interface.
export interface EmailListDTO extends BaseEntity {
  subject?: string;
  from?: string;
  receivedAt?: Date;
  isRead?: boolean;
  providerMessageId?: string;
  accountId?: string;
  threadId?: string;
  threadCount?: number;
  attachmentCount?: number;
  body?: string;
  bodyHtml?: string;
  bodyPlain?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  hasAttachments?: boolean;
  // Phase 4: AI metadata for list views
  aiCategory?: EMAIL_AI_CATEGORY;
  aiPriority?: EMAIL_AI_PRIORITY;
  aiSummary?: string;
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
  actionItems: string[];
  generatedAt: number;
}
```

#### [NEW] `SuggestedReplyItem` (Phase 4)

```typescript
import { SUGGESTED_REPLY_TONE } from "./emails.enums.js";

// Individual suggested reply option
export interface SuggestedReplyItem {
  id: string;
  title: string;
  body: string;
  tone: SUGGESTED_REPLY_TONE;
}
```

#### [NEW] `GetSuggestedRepliesResponse` (Phase 4)

```typescript
// Response payload for contextual quick replies
export interface GetSuggestedRepliesResponse {
  emailId: string;
  suggestions: SuggestedReplyItem[];
  generatedAt: number;
}
```

---

### 2.4 Component: `src/ai/ai.interfaces.ts` (NEW MODULE)

#### [NEW] Provider Strategy Contracts (Phase 1)

```typescript
import {
  EMAIL_AI_CATEGORY,
  EMAIL_AI_PRIORITY,
} from "../emails/emails.enums.js";
import { SuggestedReplyItem } from "../emails/emails.interfaces.js";

// Input parameter for email classification & priority scoring
export interface AiClassifyEmailParams {
  subject: string;
  from: string;
  to: string[];
  bodyPlain: string;
  receivedAt: Date;
}

// Result of classification & scoring
export interface AiClassifyEmailResult {
  category: EMAIL_AI_CATEGORY;
  priority: EMAIL_AI_PRIORITY;
  summary: string;
  tags: string[];
  confidence: number;
}

// Input message item for thread summarization
export interface AiThreadMessageInput {
  from: string;
  date: Date;
  bodyPlain: string;
}

// Input parameter for thread summarization
export interface AiSummarizeThreadParams {
  threadSubject: string;
  messages: AiThreadMessageInput[];
}

// Result of thread summarization
export interface AiSummarizeThreadResult {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
}

// Input parameter for suggested replies
export interface AiSuggestedRepliesParams {
  subject: string;
  from: string;
  to: string[];
  bodyPlain: string;
  receivedAt: Date;
  recentMessages?: AiThreadMessageInput[];
}

// Result of suggested replies
export interface AiSuggestedRepliesResult {
  suggestions: SuggestedReplyItem[];
}
```

---

### 2.5 Component: `src/ai/index.ts` (NEW MODULE BARREL)

#### [NEW] Module Barrel Export (Phase 1)

```typescript
export * from "./ai.enums.js";
export * from "./ai.interfaces.js";
```

> [!IMPORTANT]
> The root barrel export at `src/index.ts` MUST also be updated to include:
>
> ```typescript
> export * from "./ai/index.js";
> ```

---

### 2.6 Component: `src/user/user.interfaces.ts`

#### [NEW] `UserAIFeatureSettings` (Phase 4)

```typescript
// Granular sub-feature toggles
export interface UserAIFeatureSettings {
  categorization: boolean;
  priorityScoring: boolean;
  summarization: boolean;
  suggestedReplies: boolean;
}
```

#### [NEW] `UserAISettings` (Phase 4)

```typescript
import { UserAIFeatureSettings } from "./user.interfaces.js";

// Global and granular user AI preferences
export interface UserAISettings {
  enabled: boolean;
  features: UserAIFeatureSettings;
  disabledAccountIds: string[];
  consentGivenAt?: Date;
}
```

#### [MODIFY] `UserSettings` (Phase 4)

```typescript
import { BaseEntity } from "../common/common.interfaces.js";
import { UserAccountSettings, UserAISettings } from "./user.interfaces.js";

export interface UserSettings extends BaseEntity {
  userId: string;
  account: UserAccountSettings;
  // Phase 4: AI configuration
  ai: UserAISettings;
}
```

#### [NEW] `UpdateUserAISettingsPayload` (Phase 4)

```typescript
import { UserAIFeatureSettings } from "./user.interfaces.js";

// Request payload for updating AI user preferences
export interface UpdateUserAISettingsPayload {
  enabled?: boolean;
  features?: Partial<UserAIFeatureSettings>;
  disabledAccountIds?: string[];
}
```

#### [NEW] `GetUserAISettingsResponse` (Phase 4)

```typescript
import { UserAISettings } from "./user.interfaces.js";

// Response envelope for user AI settings retrieval
export interface GetUserAISettingsResponse {
  settings: UserAISettings;
  globalFeatureFlag: boolean;
}
```

---

### 2.7 Component: `src/workers/workers.interfaces.ts`

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
import {
  EMAIL_AI_CATEGORY,
  EMAIL_AI_PRIORITY,
} from "../emails/emails.enums.js";
import { AI_PROCESSING_STATUS } from "../ai/ai.enums.js";

// Result returned upon completion of AI processing job
export interface AIProcessingJobResult {
  emailId: string;
  status: AI_PROCESSING_STATUS;
  category?: EMAIL_AI_CATEGORY;
  priority?: EMAIL_AI_PRIORITY;
  hasSummary: boolean;
  processingDurationMs: number;
  skippedReason?: string;
}
```

### 2.6 Component: `src/common/common.interfaces.ts`

#### [MODIFY] `Filter` (Phase 5)

```typescript
// Shared search and filter options interface used across frontend & backend
export interface Filter {
  searchText?: string | undefined;
  accountId?: string[] | undefined;
  dateRange?: DATE_RANGE | undefined;
  folders?: string[] | undefined;
  unread?: boolean | undefined;
  aiCategory?: EMAIL_AI_CATEGORY | undefined;
  aiPriority?: EMAIL_AI_PRIORITY | undefined;
}
```

---

## 3. Package Version & CHANGELOG.md Update

### Package Version

```json
"version": "1.8.0"
```

### `mailsense-types/CHANGELOG.md` Snippet

```markdown
## [1.8.0] - 2026-11-24

### Added

- `EMAIL_AI_CATEGORY` enum defining smart categorization classifications (`work`, `personal`, `finance`, `social`, `promotions`, `updates`, `general`).
- `EMAIL_AI_PRIORITY` enum defining inbox triage priority levels (`critical`, `high`, `normal`, `low`).
- `SUGGESTED_REPLY_TONE` enum defining tone variants for suggested replies (`formal`, `casual`, `concise`).
- `AI_PROVIDER_NAME` enum defining pluggable AI strategies (`gemini`, `openai`, `anthropic`, `noop`).
- `AI_FEATURE_KEY` enum defining granular sub-feature toggles (`categorization`, `priorityScoring`, `summarization`, `suggestedReplies`).
- `AI_PROCESSING_STATUS` enum defining discriminated background job outcomes (`success`, `skipped`, `failed`, `rateLimited`).
- Provider strategy contracts under `src/ai/`: `AiClassifyEmailParams`, `AiClassifyEmailResult`, `AiThreadMessageInput`, `AiSummarizeThreadParams`, `AiSummarizeThreadResult`, `AiSuggestedRepliesParams`, and `AiSuggestedRepliesResult`.
- `EmailAiMetadata` interface containing unified classification, priority, summary, tags, and confidence metrics.
- `GetEmailSummaryResponse` and `SuggestedReplyItem` / `GetSuggestedRepliesResponse` interfaces for on-demand AI endpoints.
- `UserAIFeatureSettings`, `UserAISettings`, `UpdateUserAISettingsPayload`, and `GetUserAISettingsResponse` for AI settings and privacy management.
- `AIProcessingJobPayload` and `AIProcessingJobResult` contracts for BullMQ queue workers.

### Changed

- Extended `EmailAttributes` with optional `aiCategory`, `aiPriority`, `aiSummary`, `aiTags`, `aiProcessedAt`, and `aiProvider`.
- Additively extended `EmailListDTO` with `aiCategory`, `aiPriority`, and `aiSummary` for list view rendering while preserving all existing fields.
- Extended `Filter` and `GetAllEmailsFilters` with `aiCategory` and `aiPriority` filter fields.
- Extended `UserSettings` entity with `ai: UserAISettings` configuration.
```

---

## 4. Build & Local Testing Steps

```bash
# 1. Build @mailsense/types
cd /Users/vishaljagamani/Projects/Projects/mailsense-types
pnpm build

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
