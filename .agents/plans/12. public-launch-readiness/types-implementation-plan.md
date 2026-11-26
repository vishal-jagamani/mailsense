# Public Launch Readiness, Hardened Observability & Compliance Types — Overview & Contract Changes

> **Target Version:** `@mailsense/types` `v1.9.0`
> **Status:** DRAFT
> **Created:** 2026-11-25 · **Last Updated:** 2026-11-25

---

## 1. Overview

### Problem Statement

Before launching MailSense publicly as an open-source application across social media and search engines, four core cross-stack contract gaps exist between the Backend, Workers, and Frontend:

1. **AI Job & Token Spend Telemetry Missing:** While background email synchronization tracks execution records via `SyncJobAttributes`, `AIProcessingWorker` and on-demand AI endpoints do not persist execution status, model attribution, input/output/total tokens spent, or failure reasons to MongoDB. Additionally, `AiClassifyEmailResult`, `AiSummarizeThreadResult`, and `AiSuggestedRepliesResult` currently discard provider `usageMetadata`.
2. **Database Error Persistence & Client Error Bridge Missing:** Errors are emitted to stdout logs and Sentry, but there is no strongly typed `ErrorLogAttributes` schema for persistent MongoDB error debugging or `ReportClientErrorPayload` contract for forwarding React `ErrorBoundary` crashes.
3. **In-App User Feedback & Bug Reporting Contracts Missing:** There are no shared DTOs or enums (`FEEDBACK_CATEGORY`, `FEEDBACK_STATUS`, `CreateFeedbackPayload`, `CreateFeedbackResponse`) enabling users to submit structured bug reports, feature suggestions, and feedback with optional diagnostic `traceId` metadata.
4. **GDPR Account Wipe & Type Safety Gaps in `user.interfaces.ts`:** Full user account deletion (`DeleteUserAccountRequest`, `DeleteUserAccountResponse`) lacks shared request/response contracts, and `UserDetailsObject.user_metadata` currently uses `Record<string, unknown>` (alongside inline object types for `identities` and `ProfileSettingsDataObject.user_metadata`), violating strict zero-`unknown` and zero-inline-types standards.
5. **Transactional Mailer Dispatch Contract Missing:** `ITransactionalMailer` requires a shared `SendTransactionalEmailParams` interface for admin error alerts and feedback notification emails.

### Goals

- Introduce AI telemetry contracts (`AI_JOB_STATUS`, `AI_OPERATION_TYPE`, `AiTokenUsage`, `AiProcessingJobAttributes`) mirroring `SyncJobAttributes`.
- Extend AI provider result interfaces (`AiClassifyEmailResult`, `AiSummarizeThreadResult`, `AiSuggestedRepliesResult`, `AIProcessingJobResult`) with optional `tokenUsage` and `modelName`.
- Create a dedicated `src/observability/` contract module defining `ERROR_LOG_SOURCE`, `ERROR_LOG_SEVERITY`, `TRANSACTIONAL_MAILER_PROVIDER`, `ErrorLogContext`, `ErrorLogAttributes`, `ReportClientErrorPayload`, `ReportClientErrorResponse`, and `SendTransactionalEmailParams`.
- Create a dedicated `src/feedback/` contract module defining `FEEDBACK_CATEGORY`, `FEEDBACK_STATUS`, `FeedbackDiagnostics`, `FeedbackAttributes`, `CreateFeedbackPayload`, and `CreateFeedbackResponse`.
- Add GDPR account wipe DTOs (`DeleteUserAccountRequest`, `DeleteUserAccountResponse`) and remediate `UserDetailsObject` / `ProfileSettingsDataObject` type violations in `src/user/user.interfaces.ts`.
- Register `./observability` and `./feedback` subpath exports in `package.json`, `tsup.config.ts`, and `src/index.ts`.
- Enforce strict TypeScript standards: zero `any`, `never`, or `unknown`, and strictly zero inline object types anywhere.

---

## 2. Types to Add & Modify

### 2.1 Component: `src/ai/ai.enums.ts`

#### [NEW] `AI_JOB_STATUS` & `AI_OPERATION_TYPE` (Phase 3)

```typescript
// Pluggable AI Provider strategies
export enum AI_PROVIDER_NAME {
  GEMINI = "gemini",
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  NOOP = "noop",
}

// Specific AI feature toggles
export enum AI_FEATURE_KEY {
  CATEGORIZATION = "categorization",
  PRIORITY_SCORING = "priorityScoring",
  SUMMARIZATION = "summarization",
  SUGGESTED_REPLIES = "suggestedReplies",
}

// Discriminated status for AI background processing job outcomes
export enum AI_PROCESSING_STATUS {
  SUCCESS = "success",
  SKIPPED = "skipped",
  FAILED = "failed",
  RATE_LIMITED = "rateLimited",
}

// Lifecycle status persisted for AI job execution records in MongoDB (Phase 3)
export enum AI_JOB_STATUS {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  SKIPPED = "skipped",
  FAILED = "failed",
  RATE_LIMITED = "rateLimited",
}

// Discriminated operation trigger types for AI execution tracking (Phase 3)
export enum AI_OPERATION_TYPE {
  BACKGROUND_CLASSIFICATION = "backgroundClassification",
  MANUAL_REPROCESS = "manualReprocess",
  ON_DEMAND_SUMMARY = "onDemandSummary",
  ON_DEMAND_SUGGESTIONS = "onDemandSuggestions",
}
```

---

### 2.2 Component: `src/ai/ai.interfaces.ts`

#### [NEW] `AiTokenUsage` & `AiProcessingJobAttributes` · [MODIFY] AI Result Contracts (Phase 3)

```typescript
import { BaseEntity } from "../common/index.js";
import {
  EMAIL_AI_CATEGORY,
  EMAIL_AI_PRIORITY,
} from "../emails/emails.enums.js";
import { SuggestedReplyItem } from "../emails/emails.interfaces.js";
import {
  AI_JOB_STATUS,
  AI_OPERATION_TYPE,
  AI_PROVIDER_NAME,
} from "./ai.enums.js";

// Token usage metrics returned by LLM providers (Phase 3)
export interface AiTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedTokens?: number;
}

// Input parameter for email classification & priority scoring
export interface AiClassifyEmailParams {
  subject: string;
  from: string;
  to: string[];
  bodyPlain: string;
  receivedAt: Date;
}

// Result of classification & scoring (Extended in Phase 3 with telemetry)
export interface AiClassifyEmailResult {
  category: EMAIL_AI_CATEGORY;
  priority: EMAIL_AI_PRIORITY;
  summary: string;
  tags: string[];
  confidence: number;
  tokenUsage?: AiTokenUsage;
  modelName?: string;
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

// Result of thread summarization (Extended in Phase 3 with telemetry)
export interface AiSummarizeThreadResult {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  tokenUsage?: AiTokenUsage;
  modelName?: string;
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

// Result of suggested replies (Extended in Phase 3 with telemetry)
export interface AiSuggestedRepliesResult {
  suggestions: SuggestedReplyItem[];
  tokenUsage?: AiTokenUsage;
  modelName?: string;
}

// Persistent execution record for AI worker jobs and on-demand inferences (Phase 3)
export interface AiProcessingJobAttributes extends BaseEntity {
  userId: string;
  accountId: string;
  emailId: string;
  bullJobId?: string | undefined;
  operationType: AI_OPERATION_TYPE;
  status: AI_JOB_STATUS;
  provider: AI_PROVIDER_NAME;
  modelName: string;
  startedAt: number;
  completedAt?: number | undefined;
  processingDurationMs?: number | undefined;
  tokenUsage?: AiTokenUsage | undefined;
  estimatedCostUsd?: number | undefined;
  skippedReason?: string | undefined;
  errorMessage?: string | undefined;
  errorCode?: string | undefined;
  attemptCount: number;
  traceId?: string | undefined;
}
```

---

### 2.3 Component: `src/workers/workers.interfaces.ts`

#### [MODIFY] `AIProcessingJobResult` (Phase 3)

```typescript
import { AI_PROCESSING_STATUS } from "../ai/ai.enums.js";
import { AiTokenUsage } from "../ai/ai.interfaces.js";
import {
  EMAIL_AI_CATEGORY,
  EMAIL_AI_PRIORITY,
} from "../emails/emails.enums.js";

// Background sync job worker execution result
export interface SyncJobResult {
  addedEmailsCount: number;
  deletedEmailsCount: number;
}

// Payload for AI processing background BullMQ job
export interface AIProcessingJobPayload {
  emailId: string;
  accountId: string;
  userId: string;
  providerMessageId: string;
  forceReprocess?: boolean;
}

// Result returned upon completion of AI processing job (Extended in Phase 3 with token usage)
export interface AIProcessingJobResult {
  emailId: string;
  status: AI_PROCESSING_STATUS;
  category?: EMAIL_AI_CATEGORY;
  priority?: EMAIL_AI_PRIORITY;
  hasSummary: boolean;
  processingDurationMs: number;
  skippedReason?: string;
  tokenUsage?: AiTokenUsage;
  modelName?: string;
}
```

---

### 2.4 Component: `src/observability/` (New Module)

#### [NEW] `src/observability/observability.enums.ts` (Phase 2)

```typescript
// Runtime origin of a persisted error event (Phase 2)
export enum ERROR_LOG_SOURCE {
  BACKEND_API = "backendApi",
  BACKEND_WORKER = "backendWorker",
  BACKEND_SYSTEM = "backendSystem",
  FRONTEND_CLIENT = "frontendClient",
}

// Alert severity tiers for persisted errors and email notifications (Phase 2)
export enum ERROR_LOG_SEVERITY {
  WARN = "warn",
  ERROR = "error",
  CRITICAL = "critical",
}

// Transactional email provider strategy identifiers for admin alerts & feedback (Phase 2)
export enum TRANSACTIONAL_MAILER_PROVIDER {
  RESEND = "resend",
  SMTP = "smtp",
  NOOP = "noop",
}
```

#### [NEW] `src/observability/observability.interfaces.ts` (Phase 2)

```typescript
import { BaseEntity } from "../common/index.js";
import { ERROR_LOG_SEVERITY, ERROR_LOG_SOURCE } from "./observability.enums.js";

// Safe, non-PII diagnostic metadata stored alongside an error record (Phase 2)
export interface ErrorLogContext {
  userId?: string | undefined;
  accountId?: string | undefined;
  jobId?: string | undefined;
  queueName?: string | undefined;
  method?: string | undefined;
  path?: string | undefined;
  pageUrl?: string | undefined;
  userAgent?: string | undefined;
  extra?: Record<string, string | number | boolean> | undefined;
}

// Persistent MongoDB error log entity for post-mortem debugging (Phase 2)
export interface ErrorLogAttributes extends BaseEntity {
  traceId?: string | undefined;
  fingerprint: string;
  source: ERROR_LOG_SOURCE;
  severity: ERROR_LOG_SEVERITY;
  module: string;
  errorCode: string;
  httpStatus?: number | undefined;
  message: string;
  stack?: string | undefined;
  context?: ErrorLogContext | undefined;
  environment: string;
  appVersion: string;
  resolved: boolean;
  occurrenceCount: number;
  lastOccurredAt: number;
}

// Request payload sent by Frontend ErrorBoundary to log unexpected UI crashes (Phase 2)
export interface ReportClientErrorPayload {
  message: string;
  stack?: string | undefined;
  componentStack?: string | undefined;
  traceId?: string | undefined;
  pageUrl: string;
  appVersion: string;
}

// Response payload acknowledging client error persistence (Phase 2)
export interface ReportClientErrorResponse {
  status: boolean;
  traceId: string;
  logged: boolean;
}

// Payload accepted by ITransactionalMailer implementations for alerts & feedback (Phase 2)
export interface SendTransactionalEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string | undefined;
}
```

#### [NEW] `src/observability/index.ts` (Phase 2)

```typescript
export * from "./observability.enums.js";
export * from "./observability.interfaces.js";
```

---

### 2.5 Component: `src/feedback/` (New Module)

#### [NEW] `src/feedback/feedback.enums.ts` (Phase 5)

```typescript
// Classification types for user-submitted feedback and bug reports (Phase 5)
export enum FEEDBACK_CATEGORY {
  BUG_REPORT = "bugReport",
  FEATURE_REQUEST = "featureRequest",
  GENERAL_FEEDBACK = "generalFeedback",
  OTHER = "other",
}

// Triage status for user feedback entries persisted in MongoDB (Phase 5)
export enum FEEDBACK_STATUS {
  NEW = "new",
  IN_REVIEW = "inReview",
  RESOLVED = "resolved",
  CLOSED = "closed",
}
```

#### [NEW] `src/feedback/feedback.interfaces.ts` (Phase 5)

```typescript
import { BaseEntity } from "../common/index.js";
import { FEEDBACK_CATEGORY, FEEDBACK_STATUS } from "./feedback.enums.js";

// Optional client diagnostic metadata attached with bug reports (Phase 5)
export interface FeedbackDiagnostics {
  pageUrl: string;
  appVersion: string;
  userAgent?: string | undefined;
  traceId?: string | undefined;
}

// Persistent feedback entity stored in MongoDB (Phase 5)
export interface FeedbackAttributes extends BaseEntity {
  userId: string;
  userEmail: string;
  category: FEEDBACK_CATEGORY;
  title: string;
  description: string;
  diagnostics?: FeedbackDiagnostics | undefined;
  status: FEEDBACK_STATUS;
  emailDispatched: boolean;
}

// API request payload for submitting in-app feedback or bug reports (Phase 5)
export interface CreateFeedbackPayload {
  category: FEEDBACK_CATEGORY;
  title: string;
  description: string;
  contactEmail?: string | undefined;
  diagnostics?: FeedbackDiagnostics | undefined;
}

// API response envelope confirming feedback persistence & notification (Phase 5)
export interface CreateFeedbackResponse {
  status: boolean;
  message: string;
  feedbackId: string;
}
```

#### [NEW] `src/feedback/index.ts` (Phase 5)

```typescript
export * from "./feedback.enums.js";
export * from "./feedback.interfaces.js";
```

---

### 2.6 Component: `src/user/user.interfaces.ts`

#### [MODIFY] `UserDetailsObject`, `ProfileSettingsDataObject` (Phase 1) & [NEW] `DeleteUserAccountRequest`, `DeleteUserAccountResponse` (Phase 4)

```typescript
// Named Auth0 identity entry replacing inline object array in UserDetailsObject (Phase 1)
export interface Auth0UserIdentity {
  connection: string;
  provider: string;
  user_id: string;
  isSocial: boolean;
}

// Named Auth0 user_metadata schema replacing Record<string, unknown> and inline object types (Phase 1)
export interface Auth0UserMetadata {
  phone_number?: string | undefined;
  preferred_locale?: string | undefined;
  marketing_consent?: boolean | undefined;
}

// Detailed Auth0 user profile payload object (Remediated in Phase 1 — zero unknown/inline types)
export interface UserDetailsObject {
  created_at: string;
  email: string;
  email_verified: boolean;
  identities: Auth0UserIdentity[];
  name: string;
  nickname: string;
  picture: string;
  updated_at: string;
  user_id: string;
  user_metadata: Auth0UserMetadata;
  last_ip: string;
  last_login: string;
  logins_count: number;
}

// User profile settings data structure (Remediated in Phase 1 — zero inline object types)
export interface ProfileSettingsDataObject {
  nickname: string;
  name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  sub: string;
  user_metadata: Auth0UserMetadata;
}

// Confirmed GDPR full user account wipe request payload (Phase 4)
export interface DeleteUserAccountRequest {
  confirmationText: string;
  reason?: string | undefined;
}

// Summary response returned after full user data deletion & OAuth revocation (Phase 4)
export interface DeleteUserAccountResponse {
  status: boolean;
  message: string;
  deletedAccountsCount: number;
  deletedEmailsCount: number;
}
```

---

### 2.7 Component: `src/index.ts`, `tsup.config.ts` & `package.json`

#### [MODIFY] Root Export, Bundler Entrypoints & Package Subpath Exports (Phase 1)

```typescript
// src/index.ts additions
export * from "./feedback/index.js";
export * from "./observability/index.js";
```

```typescript
// tsup.config.ts entry additions
'src/observability/index.ts',
'src/feedback/index.ts',
```

```json
// package.json "exports" additions (apply during Phase 1 execution, NOT planning)
"./observability": {
  "types": "./dist/observability/index.d.ts",
  "import": "./dist/observability/index.js",
  "require": "./dist/observability/index.cjs"
},
"./feedback": {
  "types": "./dist/feedback/index.d.ts",
  "import": "./dist/feedback/index.js",
  "require": "./dist/feedback/index.cjs"
}
```

---

## 3. Package Version & CHANGELOG.md Update

### Package Version

```json
"version": "1.9.0"
```

### `mailsense-types/CHANGELOG.md` Snippet

```markdown
## [1.9.0] - 2026-11-25

### Added

- AI Telemetry contracts under `src/ai/`: `AI_JOB_STATUS`, `AI_OPERATION_TYPE`, `AiTokenUsage`, and `AiProcessingJobAttributes` for tracking MongoDB AI job runs and token consumption.
- Observability & persistent error contracts under `src/observability/`: `ERROR_LOG_SOURCE`, `ERROR_LOG_SEVERITY`, `TRANSACTIONAL_MAILER_PROVIDER`, `ErrorLogContext`, `ErrorLogAttributes`, `ReportClientErrorPayload`, `ReportClientErrorResponse`, and `SendTransactionalEmailParams`.
- User feedback & bug reporting contracts under `src/feedback/`: `FEEDBACK_CATEGORY`, `FEEDBACK_STATUS`, `FeedbackDiagnostics`, `FeedbackAttributes`, `CreateFeedbackPayload`, and `CreateFeedbackResponse`.
- GDPR full account deletion contracts (`DeleteUserAccountRequest`, `DeleteUserAccountResponse`) and named Auth0 metadata types (`Auth0UserIdentity`, `Auth0UserMetadata`) under `src/user/`.

### Changed

- Extended `AiClassifyEmailResult`, `AiSummarizeThreadResult`, `AiSuggestedRepliesResult`, and `AIProcessingJobResult` with optional `tokenUsage` and `modelName` telemetry fields.
- Replaced `Record<string, unknown>` and inline object signatures in `UserDetailsObject` and `ProfileSettingsDataObject` with `Auth0UserIdentity` and `Auth0UserMetadata`.
- Registered `./observability` and `./feedback` subpath exports in `package.json`, `tsup.config.ts`, and `src/index.ts`.
```

---

## 4. Build & Local Testing Steps

```bash
# 1. Build @mailsense/types
cd /Users/vishaljagamani/Projects/Projects/mailsense-types
pnpm build

# 2. Type-check contracts
npx tsc --noEmit

# 3. Verify symlinks / downstream consumption
cd /Users/vishaljagamani/Projects/Projects/mailsense/Backend && pnpm build
cd /Users/vishaljagamani/Projects/Projects/mailsense/Frontend && npx tsc --noEmit
```
