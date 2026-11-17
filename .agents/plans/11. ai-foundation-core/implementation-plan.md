# AI Foundation & Core Features — Implementation Plan

> **Phase:** Sprint P8 (AI Foundation & Core Features) · **Release Target:** `Backend v3.7.0` / `Frontend v3.7.0` / `@mailsense/types v1.7.0`
> **Priority:** 🟡 HIGH — Core differentiator transforming MailSense from a multi-account aggregator into an intelligent, AI-augmented email workspace
> **Status:** READY FOR REVIEW & EXECUTION
> **Created:** 2026-09-14 · **Last Updated:** 2026-11-15

---

## 1. Overview

### Problem Statement

MailSense currently provides full email aggregation, two-way provider synchronization (Gmail & Outlook), thread management, drafts, search, and analytics across unified and account-specific inboxes. However, users still suffer from cognitive overload when dealing with high-volume inboxes:

1. **Information Overload:** Sifting through marketing promotions, automated transaction receipts, and system notifications to find actionable messages is manual, slow, and error-prone.
2. **Priority Blindness:** Critical messages from executives, key clients, or urgent project alerts blend indistinguishably with low-priority newsletters.
3. **Lengthy Thread Fatigue:** Long email conversations require reading every back-and-forth exchange to extract core decisions, pending questions, or assigned action items.
4. **Repetitive Response Crafting:** Typing standard acknowledgments, meeting confirmations, or polite declines is repetitive and time-consuming.

The event-driven foundation (Event Bus, BullMQ workers, and `EMAIL_CREATED` / `EMAIL_BATCH_SYNCED` events), the multi-tenant security architecture (strict `userId` scoping), and the full-stack observability infrastructure (standardized domain error hierarchy, structured Pino logging, distributed tracing) are fully hardened as of Health Audit v1.5.0 (Health Score: **98.5 / 100**). The codebase is 100% prepared for an asynchronous, pluggable AI pipeline.

### Goals

- **Configurable AI Provider / Strategy Design Pattern:** Architect a provider-agnostic AI subsystem (`IAiProvider`, `AiProviderFactory`) defaulting to Google Gemini (`gemini-2.5-flash`), with pluggable support for alternate providers (e.g., OpenAI, Anthropic, local LLMs) and a `NoopAiProvider` for offline testing.
- **Asynchronous AI Worker Pipeline:** Integrate BullMQ queue (`ai-processing`) subscribing to `EMAIL_CREATED` events to perform background email classification and scoring without blocking sync ingestion or degrading user UI performance.
- **Smart Categorization:** Automatically classify incoming emails into structured categories (`work`, `personal`, `finance`, `social`, `promotions`, `updates`, `general`) using structured JSON schema generation.
- **Priority Scoring & Priority Inbox View:** Score emails into `critical`, `high`, `normal`, and `low` priority levels based on urgency, relationship context, and deadlines. Support a dedicated "Priority Inbox" view and visual warning indicators.
- **Email & Thread Summarization:** Generate one-line TL;DR summaries during ingestion for instant list-view previews and provide on-demand multi-bullet thread summaries with key action items in the conversation view.
- **Contextual Suggested Replies:** Generate 2–3 tone-adapted quick replies (e.g., Formal confirmation, Casual acknowledgment, Clarification request) that launch the compose modal pre-populated with context.
- **AI Settings, Privacy Controls & Data Minimization:** Provide global, per-feature, and per-account AI toggles, coupled with explicit user consent tracking and strict prompt sanitization (HTML stripped, 4,000 char truncation, zero attachments/base64 sent to LLM).
- **Architecture & Standards Compliance:** Align with MailSense Coding Standards (categorized subdirectories, barrel exports, zero `any`, zero inline object types, boundary-based error handling).

### Non-Goals

- **Email Auto-Sending:** AI will never dispatch emails automatically. Suggested replies require explicit user review, editing, and dispatch via the composer.
- **Model Fine-Tuning / Data Retention:** We will not fine-tune custom models or permit third-party retention of user emails. Data transmission strictly adheres to zero-retention enterprise API agreements.
- **Natural Language Search / Agentic Tools:** Natural language semantic email queries and autonomous multi-step agent workflows are reserved for Phase 7 (Advanced AI).
- **Custom User Rules Engine:** User-defined heuristic filter rules (e.g. "If sender = boss, mark important") belong to Phase 5.

### Background / Architectural Context

In the MailSense architecture, email ingestion occurs via background sync workers (`SyncAccountProcessor`) which process changes from Gmail and Outlook. Upon creating an email record in MongoDB, an `EMAIL_CREATED` event is broadcast through `EventBus`. The handler in `Backend/src/core/events/handlers/email-created.handler.ts` was architected with a dedicated hook to enqueue AI jobs.

Building on the Phase 3 Observability framework, all AI operations will carry distributed correlation IDs (`traceId`), performance timers (`withTiming`), structured metadata (`LOGGER_MODULE.AI_SERVICE`), and strict error classification (`ExternalServiceError`, `AiProcessingError`).

---

## 2. Requirements

### Functional Requirements

1. **FR-01 (Pluggable Provider Strategy):** The backend MUST load AI capabilities through an `IAiProvider` interface selected via `AiProviderFactory` based on configuration (`AI_PROVIDER=gemini`). Switching providers must require zero modifications to controllers, workers, or business services.
2. **FR-02 (Asynchronous Classification & Priority Scoring):** When a new email arrives via background sync, the system MUST enqueue an `ai-processing` BullMQ job if AI is enabled for the account. The AI provider classifies the category (`work`, `personal`, `finance`, `social`, `promotions`, `updates`, `general`), computes the priority (`critical`, `high`, `normal`, `low`), and generates a 1-sentence TL;DR summary.
3. **FR-03 (Inbox Category Badges & Filtering):** The frontend email list MUST render color-coded category badges on email rows and support filtering by category in mailbox query filters.
4. **FR-04 (Priority Inbox View):** Users MUST be able to filter by priority level or switch to a "Priority" view displaying Critical and High priority messages.
5. **FR-05 (On-Demand Thread Summarization):** Users can click "Summarize" inside an email thread to trigger an on-demand API call returning bulleted key points and extracted action items.
6. **FR-06 (Contextual Suggested Replies):** The email detail view MUST display 2–3 contextual reply chips. Clicking a chip opens the Compose modal pre-filled with the recipient, subject (`Re: ...`), and suggested reply text.
7. **FR-07 (Granular Privacy & Account Controls):** Users MUST be able to toggle AI globally, toggle specific sub-features (`categorization`, `priorityScoring`, `summarization`, `suggestedReplies`), and disable AI for specific connected accounts. If AI is disabled for an account, incoming emails skip AI ingestion completely.

### Non-Functional Requirements

- **NFR-01 (Latency & Performance):** Background email classification must complete within $\le 3$ seconds of queue pickup under standard load. On-demand summary and suggestion endpoints must return responses within $\le 2.5$ seconds.
- **NFR-02 (Rate Limiting & Resilient Backoff):** The AI provider integration must enforce queue-level concurrency limits, exponential backoff (starting at 2s with up to 3 retries), and graceful degradation on 429 quota exhaustion.
- **NFR-03 (Data Minimization & Privacy):** Prompts sent to AI providers MUST contain only essential text fields (`subject`, `from`, `receivedAt`, and sanitized `bodyPlain` truncated to 4,000 characters). Raw HTML, scripts, base64 payloads, and binary attachments must NEVER be sent to the LLM.
- **NFR-04 (Strict Type Safety):** Zero tolerance for `any`, `never`, or `unknown` types across backend and frontend codebases. All domain enums, job payloads, and DTOs must be exported from `@mailsense/types v1.7.0`. Zero inline object types.
- **NFR-05 (Fault Isolation):** Failures in the AI worker or upstream AI API must NEVER fail email synchronization or prevent users from reading, composing, or managing emails.

### Acceptance Criteria

- [ ] `IAiProvider` interface, `AiProviderFactory`, `GeminiAiProvider`, and `NoopAiProvider` implemented with 100% test coverage.
- [ ] New emails ingested during background sync receive `aiCategory`, `aiPriority`, `aiSummary`, and `aiProcessedAt` in MongoDB.
- [ ] Email table displays category pills and priority indicators with zero layout shift.
- [ ] `GET /api/emails` supports filtering by `aiCategory` and `aiPriority`.
- [ ] `POST /api/ai/summary/:emailId` returns structured bullet points and action items within 3 seconds.
- [ ] `GET /api/ai/suggestions/:emailId` returns 2–3 contextual suggested replies that populate the composer upon click.
- [ ] Disabling AI globally or for a specific account stops background AI job enqueueing immediately.
- [ ] Both Backend and Frontend compile with 0 errors (`pnpm build` & `npx tsc --noEmit`).

---

## 3. Architecture & Design Patterns

### 3.1 High-Level Architecture Topology

```mermaid
graph TD
    Client[Next.js Frontend] -->|REST API with JWT & Trace ID| Gateway[Express API Gateway]
    Gateway --> AuthMiddleware[Auth Middleware & Tenant Scoping]
    AuthMiddleware --> AIController[AI Controller /api/ai]
    AuthMiddleware --> EmailController[Email Controller /api/emails]

    EmailController --> EmailQueryService[Email Query Service]
    EmailQueryService --> EmailRepo[Email Repository]
    EmailRepo --> MongoDB[(MongoDB Store)]

    AIController --> AIService[AI Service Facade]
    AIService --> UserSettingsRepo[User Settings Repository]
    AIService --> AiFactory[AI Provider Factory]
    AiFactory -->|Strategy Resolution| GeminiProvider[Gemini AI Provider]
    AiFactory -->|Offline / Test Fallback| NoopProvider[Noop AI Provider]
    GeminiProvider -->|Structured JSON Prompt| GeminiAPI[Google Gemini 2.5 Flash API]

    SyncWorker[Sync Worker / Queue] -->|Sync Complete| EventBus[EventBus]
    EventBus -->|EMAIL_CREATED| EmailCreatedHandler[Email Created Handler]
    EmailCreatedHandler -->|Check AI Settings| QueueService[Queue Service]
    QueueService -->|Enqueue Job| BullMQ[BullMQ ai-processing Queue]
    BullMQ -->|Consume Job| AIWorker[AI Processing Worker]
    AIWorker --> AIService
    AIService -->|Update Metadata| EmailRepo
```

---

### 3.2 AI Provider Strategy Design Pattern

To prevent vendor lock-in and guarantee long-term maintainability, the AI subsystem follows the **Provider / Strategy Pattern**, identical to how MailSense abstracts email providers (`IEmailProvider` $\to$ `GmailProvider`, `OutlookProvider`):

```mermaid
classDiagram
    class IAiProvider {
        <<interface>>
        +string name
        +classifyAndScoreEmail(params: AiClassifyEmailParams) Promise~AiClassifyEmailResult~
        +summarizeEmailThread(params: AiSummarizeThreadParams) Promise~AiSummarizeThreadResult~
        +generateSuggestedReplies(params: AiSuggestedRepliesParams) Promise~AiSuggestedRepliesResult~
    }

    class GeminiAiProvider {
        -GoogleGenAI genAIClient
        -string modelName
        +classifyAndScoreEmail(params: AiClassifyEmailParams) Promise~AiClassifyEmailResult~
        +summarizeEmailThread(params: AiSummarizeThreadParams) Promise~AiSummarizeThreadResult~
        +generateSuggestedReplies(params: AiSuggestedRepliesParams) Promise~AiSuggestedRepliesResult~
        -sanitizeContent(bodyPlain: string) string
    }

    class NoopAiProvider {
        +classifyAndScoreEmail(params: AiClassifyEmailParams) Promise~AiClassifyEmailResult~
        +summarizeEmailThread(params: AiSummarizeThreadParams) Promise~AiSummarizeThreadResult~
        +generateSuggestedReplies(params: AiSuggestedRepliesParams) Promise~AiSuggestedRepliesResult~
    }

    class AiProviderFactory {
        -static IAiProvider cachedProvider
        +static getProvider(providerName?: string) IAiProvider
        +static reset() void
    }

    class AIService {
        -AiProviderFactory factory
        -UserSettingsRepository userSettingsRepo
        -EmailRepository emailRepo
        +processEmailIngestion(job: AIProcessingJobPayload) Promise~void~
        +summarizeThread(userId: string, emailId: string) Promise~GetEmailSummaryResponse~
        +getSuggestedReplies(userId: string, emailId: string) Promise~GetSuggestedRepliesResponse~
    }

    IAiProvider <|.. GeminiAiProvider
    IAiProvider <|.. NoopAiProvider
    AiProviderFactory --> IAiProvider : resolves & caches
    AIService --> AiProviderFactory : obtains provider
```

---

### 3.3 Sequence Flows

#### Flow 1: Asynchronous Email Ingestion & Classification Pipeline

```mermaid
sequenceDiagram
    autonumber
    participant Sync as SyncAccountProcessor
    participant Bus as EventBus
    participant Handler as EmailCreatedHandler
    participant UserRepo as UserSettingsRepository
    participant Queue as QueueService
    participant Worker as AIWorker
    participant AIService as AIService
    participant Factory as AiProviderFactory
    participant Provider as GeminiAiProvider
    participant EmailRepo as EmailRepository

    Sync->>Bus: publish(EMAIL_CREATED, { accountId, userId, emailId })
    Bus->>Handler: handleEmailCreated(event)
    Handler->>UserRepo: getAiSettings(userId)
    alt AI Disabled Globally or for Account
        Handler-->>Bus: Skip enqueueing (Debug Log)
    else AI Enabled
        Handler->>Queue: enqueueAiProcessingJob({ emailId, accountId, userId })
        Queue-->>Handler: bullJobId
    end

    Queue->>Worker: processJob(job)
    Worker->>AIService: processEmailIngestion(job.data)
    AIService->>EmailRepo: getEmail(emailId, accountId)
    AIService->>Factory: getProvider()
    Factory-->>AIService: GeminiAiProvider instance
    AIService->>Provider: classifyAndScoreEmail({ subject, from, bodyPlain, receivedAt })
    Provider->>Provider: Truncate bodyPlain to 4000 chars & format JSON schema
    Provider-->>AIService: { category, priority, summary, tags }
    AIService->>EmailRepo: updateEmailAiMetadata(emailId, accountId, metadata)
    AIService-->>Worker: Processing Success
    Worker-->>Queue: Job Completed
```

#### Flow 2: On-Demand Thread Summarization Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as ThreadView Component
    participant Controller as AiController
    participant AIService as AIService
    participant EmailRepo as EmailRepository
    participant Provider as IAiProvider

    User->>UI: Click "AI Summary" Button
    UI->>Controller: POST /api/ai/summary/:emailId
    Controller->>Controller: Verify req.userId & extract params
    Controller->>AIService: summarizeThread(userId, emailId)
    AIService->>EmailRepo: getEmail(emailId)
    AIService->>EmailRepo: getEmailsByThreadId(threadId, accountId)
    AIService->>Provider: summarizeEmailThread({ threadSubject, messages })
    Provider-->>AIService: { summary, keyPoints, actionItems }
    AIService-->>Controller: GetEmailSummaryResponse
    Controller-->>UI: 200 OK (Summary DTO)
    UI-->>User: Render Collapsible AI Summary Card
```

---

### 3.4 Data Models & Schema Updates

#### 1. Updated `EmailSchema` (`Backend/src/modules/emails/database/email.model.ts`)

```typescript
// Add to EmailSchema:
aiCategory: {
    type: String,
    enum: Object.values(EMAIL_AI_CATEGORY),
    default: null,
    index: true,
},
aiPriority: {
    type: String,
    enum: Object.values(EMAIL_AI_PRIORITY),
    default: null,
    index: true,
},
aiSummary: {
    type: String,
    default: null,
},
aiTags: {
    type: [String],
    default: [],
},
aiProcessedAt: {
    type: Date,
    default: null,
},
aiProvider: {
    type: String,
    default: null,
},

// Compound query indexes:
EmailSchema.index({ accountId: 1, aiCategory: 1, receivedAt: -1 });
EmailSchema.index({ accountId: 1, aiPriority: 1, receivedAt: -1 });
```

#### 2. Updated `UserSettingsSchema` (`Backend/src/modules/user/database/user.model.ts`)

```typescript
const UserAISettingsSchema = new Schema<UserAISettings>(
  {
    enabled: { type: Boolean, default: true },
    features: {
      categorization: { type: Boolean, default: true },
      priorityScoring: { type: Boolean, default: true },
      summarization: { type: Boolean, default: true },
      suggestedReplies: { type: Boolean, default: true },
    },
    disabledAccountIds: { type: [String], default: [] },
    consentGivenAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);
```

---

### 3.5 API Contracts

Mounted under `/api/ai` and `/api/user/settings`:

| Method  | Endpoint                       | Request Body                              | Response Shape                             | Description                                               |
| :------ | :----------------------------- | :---------------------------------------- | :----------------------------------------- | :-------------------------------------------------------- |
| `POST`  | `/api/ai/summary/:emailId`     | —                                         | `ApiResponse<GetEmailSummaryResponse>`     | On-demand comprehensive thread summarization              |
| `GET`   | `/api/ai/suggestions/:emailId` | —                                         | `ApiResponse<GetSuggestedRepliesResponse>` | 2–3 contextual quick reply suggestions                    |
| `GET`   | `/api/user/settings/ai`        | —                                         | `ApiResponse<GetUserAISettingsResponse>`   | Fetch current user's AI settings & feature flags          |
| `PATCH` | `/api/user/settings/ai`        | `UpdateUserAISettingsPayload`             | `ApiResponse<GetUserAISettingsResponse>`   | Update global/per-feature/per-account AI settings         |
| `GET`   | `/api/emails`                  | Query: `?aiCategory=work&aiPriority=high` | `ApiResponse<GetEmailsResponse>`           | Extended mailbox list with AI category & priority filters |

---

## 4. Component Overview & File Map

| Component                  | Target File                                                       | Action   | Purpose / Responsibilities                                                                    |
| -------------------------- | ----------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| **Shared Types**           | `@mailsense/types`                                                | [MODIFY] | Add domain enums (`EMAIL_AI_CATEGORY`, `EMAIL_AI_PRIORITY`), AI DTOs, job payloads            |
| **Config**                 | `Backend/src/core/config/app.config.ts`                           | [MODIFY] | Add `ai: { provider, geminiApiKey, geminiModel }`                                             |
| **Config**                 | `Backend/src/core/config/env.schema.ts`                           | [MODIFY] | Add Zod schema validations for `AI_PROVIDER`, `GEMINI_API_KEY`                                |
| **AI Provider Contract**   | `Backend/src/integrations/ai/ai.provider.ts`                      | [NEW]    | Declare `IAiProvider` interface                                                               |
| **AI Provider Types**      | `Backend/src/integrations/ai/ai.provider.types.ts`                | [NEW]    | Parameter and result contracts for AI strategy methods                                        |
| **AI Provider Factory**    | `Backend/src/integrations/ai/ai.provider.factory.ts`              | [NEW]    | Strategy selector and singleton cache for AI providers                                        |
| **Gemini AI Provider**     | `Backend/src/integrations/ai/providers/gemini.provider.ts`        | [NEW]    | Google GenAI SDK wrapper with structured JSON schema output                                   |
| **Noop AI Provider**       | `Backend/src/integrations/ai/providers/noop.provider.ts`          | [NEW]    | Deterministic mock provider for unit tests & offline dev                                      |
| **AI Integration Barrel**  | `Backend/src/integrations/ai/index.ts`                            | [NEW]    | Centralized export accessible via `@integrations/ai`                                          |
| **Queue Config**           | `Backend/src/core/queue/queue.config.ts`                          | [MODIFY] | Register `AI_PROCESSING` BullMQ queue                                                         |
| **Queue Service**          | `Backend/src/core/queue/queue.service.ts`                         | [MODIFY] | Add `enqueueAiProcessingJob` helper                                                           |
| **AI Worker**              | `Backend/src/workers/ai.worker.ts`                                | [NEW]    | BullMQ worker consuming `ai-processing` jobs                                                  |
| **AI Processor**           | `Backend/src/workers/processors/ai-processing.processor.ts`       | [NEW]    | Processor executing AI classification and persisting metadata                                 |
| **Event Subscriber**       | `Backend/src/core/events/handlers/email-created.handler.ts`       | [MODIFY] | Check AI settings and enqueue job on `EMAIL_CREATED`                                          |
| **Email Model**            | `Backend/src/modules/emails/database/email.model.ts`              | [MODIFY] | Add AI fields and compound indexes                                                            |
| **Email Repository**       | `Backend/src/modules/emails/database/email.repository.ts`         | [MODIFY] | Add `updateEmailAiMetadata` and extend filter builders                                        |
| **AI Module Subdirectory** | `Backend/src/modules/ai/...`                                      | [NEW]    | Categorized module: `controllers/`, `services/`, `routes/`, `schema/`, `types/`, `constants/` |
| **Frontend Endpoints**     | `Frontend/src/shared/api/endpoints.ts`                            | [MODIFY] | Add `AI_API_ENDPOINTS` constants                                                              |
| **Frontend API Client**    | `Frontend/src/features/emails/api/email-ai.api.ts`                | [NEW]    | Axios wrapper for summary and suggestions                                                     |
| **Frontend React Query**   | `Frontend/src/features/emails/api/email-ai.queries.ts`            | [NEW]    | React Query hooks (`useGetEmailSummaryQuery`, `useGetSuggestedRepliesQuery`)                  |
| **Frontend UI Badge**      | `Frontend/src/features/emails/components/CategoryBadge.tsx`       | [NEW]    | Visual color-coded category pill                                                              |
| **Frontend UI Flag**       | `Frontend/src/features/emails/components/PriorityFlag.tsx`        | [NEW]    | Visual priority level indicator                                                               |
| **Frontend Summary Card**  | `Frontend/src/features/emails/components/EmailAiSummaryCard.tsx`  | [NEW]    | Accordion card rendering key takeaways & action items                                         |
| **Frontend Reply Chips**   | `Frontend/src/features/emails/components/SuggestedRepliesBar.tsx` | [NEW]    | Contextual reply chips with compose pre-fill integration                                      |
| **Frontend Settings View** | `Frontend/src/features/settings/pages/ai/index.tsx`               | [NEW]    | AI Settings management tab (toggles, consent, overrides)                                      |

---

## 5. Step-by-Step Implementation Phases

### Phase 1: Shared Contracts & AI Provider Strategy Infrastructure

**Objective:** Release `@mailsense/types v1.7.0`, install `@google/genai`, and implement the configurable Provider/Strategy pattern (`IAiProvider`, `AiProviderFactory`, `GeminiAiProvider`, `NoopAiProvider`).
**Estimated Effort:** 1.5 days · **Target:** Backend & `@mailsense/types`

#### Tasks:

1. Define shared contracts in `@mailsense/types`:
   - Enums: `EMAIL_AI_CATEGORY`, `EMAIL_AI_PRIORITY`, `AI_PROVIDER_NAME`.
   - DTOs: `AiClassifyEmailResult`, `AiSummarizeThreadResult`, `AiSuggestedRepliesResult`, `AIProcessingJobPayload`, `UserAISettings`.
   - Build `@mailsense/types` and link in Backend and Frontend.
2. Update Backend environment config (`env.schema.ts`, `app.config.ts`) to validate `AI_PROVIDER` and `GEMINI_API_KEY`.
3. Create `Backend/src/integrations/ai/ai.provider.ts` declaring `IAiProvider`.
4. Create `Backend/src/integrations/ai/providers/noop.provider.ts` for offline testing.
5. Create `Backend/src/integrations/ai/providers/gemini.provider.ts` wrapping Google GenAI with structured JSON generation and error wrapping.
6. Create `Backend/src/integrations/ai/ai.provider.factory.ts` resolving provider strategies with singleton caching.
7. Write unit tests in `Backend/src/integrations/ai/__tests__/provider.factory.test.ts` and `gemini.provider.test.ts`.

---

### Phase 2: Asynchronous AI Queue & Ingestion Pipeline

**Objective:** Establish BullMQ `ai-processing` queue, implement `AIProcessingWorker`, update `EmailSchema`, and connect `EMAIL_CREATED` event dispatching.
**Estimated Effort:** 1.5 days · **Target:** Backend Infrastructure & Database

#### Tasks:

1. Update `EmailSchema` and `EmailDocument` with AI fields (`aiCategory`, `aiPriority`, `aiSummary`, `aiTags`, `aiProcessedAt`, `aiProvider`) and compound indexes.
2. Implement `EmailRepository.updateEmailAiMetadata` in `Backend/src/modules/emails/database/email.repository.ts`.
3. Register `QUEUE_NAMES.AI_PROCESSING` in `Backend/src/core/queue/queue.config.ts`.
4. Add `QueueService.enqueueAiProcessingJob` in `Backend/src/core/queue/queue.service.ts`.
5. Implement `aiProcessingProcessor` in `Backend/src/workers/processors/ai-processing.processor.ts` with sanitized prompt trimming (max 4,000 chars) and error handling.
6. Create `AIProcessingWorker` in `Backend/src/workers/ai.worker.ts` extending `BaseWorker`.
7. Wire up `Backend/src/core/events/handlers/email-created.handler.ts` to inspect user AI settings and enqueue jobs.
8. Wire worker startup and shutdown in `Backend/src/core/queue/index.ts`.
9. Write worker unit tests in `Backend/src/workers/__tests__/ai.worker.test.ts`.

---

### Phase 3: Core AI Module & On-Demand REST Endpoints

**Objective:** Create categorized `Backend/src/modules/ai/` module with controllers, services, and routes for on-demand thread summarization and suggested replies.
**Estimated Effort:** 2 days · **Target:** Backend API Layer

#### Tasks:

1. Create `Backend/src/modules/ai/` organized into categorized subdirectories:
   - `controllers/ai.controller.ts`: Handles `POST /summary/:emailId` and `GET /suggestions/:emailId` with caller tenant verification.
   - `services/ai.service.ts`: Orchestrates email retrieval, thread assembly, provider delegation, and telemetry logging.
   - `routes/ai.routes.ts`: Routes with Zod parameter validation schemas.
   - `schema/ai.schema.ts`: Validation schemas for route parameters.
   - `types/ai.types.ts`: Module-specific named interfaces.
   - `constants/ai.constants.ts`: Module error codes and constants.
2. Mount AI router under `/api/ai` in `Backend/src/routes.ts`.
3. Extend `EmailQueryService` and `EmailRepository.getEmails` to support filtering by `aiCategory` and `aiPriority`.
4. Add integration tests in `Backend/src/modules/ai/__tests__/ai.integration.test.ts`.

---

### Phase 4: AI Settings & Privacy Controls

**Objective:** Add user AI settings management, consent tracking, and per-account overrides.
**Estimated Effort:** 1 day · **Target:** Backend User Module & Frontend Settings

#### Tasks:

1. Extend `UserSettingsSchema` in `Backend/src/modules/user/database/user.model.ts` with `UserAISettingsSchema`.
2. Add `getAiSettings` and `updateAiSettings` methods to `UserSettingsRepository`.
3. Add `GET /api/user/settings/ai` and `PATCH /api/user/settings/ai` endpoints in `Backend/src/modules/user/`.
4. Create Frontend API client and React Query hooks (`useGetAiSettingsQuery`, `useUpdateAiSettingsMutation`).
5. Create `AiSettingsTab.tsx` in `Frontend/src/features/settings/components/` with global toggle, feature checkboxes, and per-account exclusion switches.
6. Mount "AI Settings" tab in Settings page navigation.

---

### Phase 5: Frontend UI Components & Inbox Integration

**Objective:** Build responsive UI components for category badges, priority flags, thread summary cards, and quick reply chips.
**Estimated Effort:** 2 days · **Target:** Frontend UI & State

#### Tasks:

1. Create `CategoryBadge.tsx` with semantic color mappings (Work: Indigo, Finance: Emerald, Personal: Sky, Social: Purple, Promotions: Pink, Updates: Amber, General: Slate).
2. Create `PriorityFlag.tsx` with distinct icons (Critical: Red Alert, High: Orange Flag, Normal: Subtle, Low: Down Arrow).
3. Integrate `CategoryBadge` and `PriorityFlag` into `EmailListTable.tsx` and `EmailCard.tsx`.
4. Add "Priority Inbox" quick-filter button to `EmailListHeader.tsx` (`useInboxData` query synchronization).
5. Add Category filter dropdown to inbox filter modal.
6. Create `EmailAiSummaryCard.tsx` with loading skeleton, bulleted summary, and action items list in `ThreadView.tsx`.
7. Create `SuggestedRepliesBar.tsx` rendering quick reply chips; clicking a chip opens the Compose modal with pre-filled content.
8. Verify zero inline types and zero ESLint errors across all new components.

---

### Phase 6: End-to-End Verification & Performance Benchmarking

**Objective:** Verify system performance, rate limiting resilience, and 100% test suite pass rate.
**Estimated Effort:** 1 day · **Target:** Full Workspace

#### Tasks:

1. Run backend unit and integration test suites: `cd Backend && npx jest` (all suites passing).
2. Run backend and frontend linting: `pnpm lint` in both workspaces (0 errors, 0 warnings).
3. Run frontend TypeScript checks: `npx tsc --noEmit` (0 errors).
4. Run production builds: `pnpm build` in Backend and Frontend.
5. Execute end-to-end QA:
   - Ingest emails and verify background classification within $\le 3$s.
   - Verify category badges and priority indicators in Unified and Account Inbox views.
   - Verify on-demand thread summarization and suggested replies.
   - Verify disabling AI for an account skips background job enqueueing.
6. Update `CHANGELOG.md`, `CODEBASE_INDEX.md`, and Health Audit Report.

---

## 6. Verification & Build Commands

```bash
# 1. Shared Types Compilation
cd /Users/vishaljagamani/Projects/Projects/mailsense-types
pnpm build

# 2. Backend Verification
cd /Users/vishaljagamani/Projects/Projects/mailsense/Backend
pnpm lint
npx jest
pnpm build

# 3. Frontend Verification
cd /Users/vishaljagamani/Projects/Projects/mailsense/Frontend
npx tsc --noEmit
pnpm lint
pnpm build
```

---

## 7. Risk Assessment & Mitigation

| Risk                                  | Impact | Likelihood | Mitigation                                                                                                                                                   |
| ------------------------------------- | ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Upstream Gemini 429 Rate Limiting     | HIGH   | MEDIUM     | Queue-level concurrency throttling, exponential backoff retries (3 attempts), and fallback to unclassified status without failing sync.                      |
| Large Email Body Token Exhaustion     | MEDIUM | HIGH       | Strict input sanitizer truncating `bodyPlain` to 4,000 characters; HTML tags, images, and attachments stripped prior to LLM call.                            |
| Inaccurate or Hallucinated Categories | LOW    | LOW        | Enforce strict Gemini JSON Schema (`responseSchema`) with enum constraints (`EMAIL_AI_CATEGORY`), temperature 0.1 for deterministic output.                  |
| User Privacy Concerns                 | HIGH   | LOW        | Explicit opt-in consent recorded; zero data sent to AI for accounts added to `disabledAccountIds`; zero-retention enterprise API.                            |
| Provider Lock-in                      | MEDIUM | LOW        | Provider / Strategy Pattern isolates all provider-specific code inside `integrations/ai/providers/`. Switching to another LLM requires zero service changes. |
