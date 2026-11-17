# AI Foundation & Core Features Types — Overview & Contract Changes

> **Target Version:** `@mailsense/types` `v1.7.0`
> **Status:** READY FOR REVIEW & EXECUTION
> **Created:** 2026-09-14 · **Last Updated:** 2026-11-15

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

- Introduce domain enums: `EMAIL_AI_CATEGORY`, `EMAIL_AI_PRIORITY`, `AI_FEATURE_KEY`, and `AI_PROVIDER_NAME`.
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

---

### 2.2 Component: `src/emails/emails.interfaces.ts`

#### [NEW] `EmailAiMetadata` (Phases 1 & 2)

```typescript
import { EMAIL_AI_CATEGORY, EMAIL_AI_PRIORITY } from "./emails.enums.js";

// Structured AI analysis metadata for email documents
export interface EmailAiMetadata {
  category: EMAIL_AI_CATEGORY;
  priority: EMAIL_AI_PRIORITY;
  summary: string;
  tags: string[];
  confidence: number;
  processedAt: number;
  provider: string;
}
```

#### [MODIFY] `EmailAttributes` (Phases 1, 2, 3)

```typescript
import { BaseEntity, DATE_RANGE, Filter } from "../common/index.js";
import { EMAIL_AI_CATEGORY, EMAIL_AI_PRIORITY } from "./emails.enums.js";

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
  aiProvider?: string;
}
```

#### [MODIFY] `EmailListDTO` (Phases 2 & 5)

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
  actionItems: string[];
  generatedAt: number;
}
```

#### [NEW] `SuggestedReplyItem` (Phase 4)

```typescript
// Individual suggested reply option
export interface SuggestedReplyItem {
  id: string;
  title: string;
  body: string;
  tone: "formal" | "casual" | "concise";
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

### 2.3 Component: `src/ai/ai.interfaces.ts` (NEW MODULE)

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
  bodyPlain: string;
  receivedAt: Date;
}

// Result of suggested replies
export interface AiSuggestedRepliesResult {
  suggestions: SuggestedReplyItem[];
}
```

---

### 2.4 Component: `src/user/user.enums.ts`

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

---

### 2.5 Component: `src/user/user.interfaces.ts`

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

### 2.6 Component: `src/workers/workers.interfaces.ts`

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
"version": "1.7.0"
```

### `mailsense-types/CHANGELOG.md` Snippet

```markdown
## [1.7.0] - 2026-11-15

### Added

- `EMAIL_AI_CATEGORY` enum defining smart categorization classifications (`work`, `personal`, `finance`, `social`, `promotions`, `updates`, `general`).
- `EMAIL_AI_PRIORITY` enum defining inbox triage priority levels (`critical`, `high`, `normal`, `low`).
- `AI_PROVIDER_NAME` enum defining pluggable AI strategies (`gemini`, `openai`, `anthropic`, `noop`).
- `AI_FEATURE_KEY` enum defining granular sub-feature toggles.
- Provider strategy contracts under `src/ai/`: `AiClassifyEmailParams`, `AiClassifyEmailResult`, `AiSummarizeThreadParams`, `AiSummarizeThreadResult`, `AiSuggestedRepliesParams`, and `AiSuggestedRepliesResult`.
- `EmailAiMetadata` interface containing unified classification, priority, summary, tags, and confidence metrics.
- `GetEmailSummaryResponse` and `SuggestedReplyItem` / `GetSuggestedRepliesResponse` interfaces for on-demand AI endpoints.
- `UserAIFeatureSettings`, `UserAISettings`, `UpdateUserAISettingsPayload`, and `GetUserAISettingsResponse` for AI settings and privacy management.
- `AIProcessingJobPayload` and `AIProcessingJobResult` contracts for BullMQ queue workers.

### Changed

- Extended `EmailAttributes` with optional `aiCategory`, `aiPriority`, `aiSummary`, `aiTags`, `aiProcessedAt`, and `aiProvider`.
- Extended `EmailListDTO` with `aiCategory`, `aiPriority`, and `aiSummary` for list view rendering.
- Extended `GetAllEmailsFilters` with `aiCategory` and `aiPriority` filter fields.
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
