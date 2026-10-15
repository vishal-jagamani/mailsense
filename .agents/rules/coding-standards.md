---
trigger: always_on
---

# MailSense Code Quality, Refactoring & Engineering Standards

> **Scope:** All Backend and Frontend source code across the MailSense project.
> **Purpose:** Define mandatory code-quality, architecture, file-size, function-size, component-size, type-safety, error-handling, and refactoring standards.
> **Last Updated:** 2026-09-27

---

## 1. Core Engineering Principles

All MailSense code MUST follow these principles:

1. Single Responsibility Principle
2. Separation of Concerns
3. High Cohesion / Low Coupling
4. Composition over unnecessary inheritance
5. Strong TypeScript typing with explicit contracts
6. Small focused functions, classes, and components
7. Testability & Maintainability
8. Predictable error handling at meaningful boundaries
9. Centralized database access (repositories only)
10. Centralized external provider integration (provider classes only)
11. No unnecessary duplication
12. No God classes, God components, or God hooks
13. No business logic in controllers
14. No business logic inside UI rendering or JSX
15. No database access outside repositories
16. No API calls directly from React components
17. No unnecessary global state — React Query owns server state, Zustand owns client/UI state
18. Refactor before complexity becomes difficult to maintain
19. Centralized type definitions — all types/interfaces MUST be in dedicated types files; strictly zero inline types anywhere
20. Boundary-based error handling — no try/catch in repositories, utilities, React components, or custom hooks
21. Standardized naming conventions — strictly kebab-case for folders and backend/utility files, PascalCase for React components, camelCase for custom hooks

---

## 2. TypeScript Type Safety & Contract Organization

### 2.1 Forbidden Types

- **No `any`**: The `any` type is STRICTLY FORBIDDEN under all circumstances. Define explicit types instead.
- **No `never`**: Avoid `never` unless representing unreachable code in exhaustive switch checks. Do not use as a placeholder or return type.
- **No `unknown`**: Do not use `unknown` in place of proper interfaces, DTOs, or generic constraints. For `catch (error)` parameters, use standard error narrowing (`error instanceof Error ? error.message : String(error)`).
- **Strict Generic Bindings**: Always write generic type parameters using typed definitions/assertions (e.g., `SystemEventPayloads[K]`, `AxiosResponse<ApiResponse<EmailAttributes>>`) instead of generic object fallback types.

### 2.2 Dedicated Types Files Only (No Types in Feature/Code Files)

- **Dedicated Types Files Required**: All TypeScript types, interfaces, enums, and DTOs MUST be declared **exclusively** inside dedicated types files.
  - **Shared contracts** (backend & frontend): MUST reside in `@mailsense/types` (`mailsense-types/src/...`).
  - **Frontend-specific types**: MUST reside in dedicated feature types files (e.g. `Frontend/src/features/<feature>/types/<name>.types.ts` or `Frontend/src/shared/types/<name>.types.ts`).
  - **Backend-specific types**: MUST reside in dedicated module interface files (e.g. `Backend/src/modules/<module>/<name>.interface.ts` or `Backend/src/core/types/<name>.types.ts`).
- **Forbidden Locations for Type Declarations**: NEVER declare `interface` or `type` definitions inside:
  - React components (`*.tsx`)
  - Custom hooks (`use*.ts`)
  - Controllers (`*.controller.ts`)
  - Services (`*.service.ts`)
  - Repositories (`*.repository.ts`)
  - Utilities (`*.utils.ts` or `*.ts`)

### 2.3 Strictly Zero Inline Types Anywhere in Entire Codebase

- **No Inline Object Types**: Inline object type definitions (e.g. `param: { id: string }`, `options: { force?: boolean }`, `useState<{ count: number }>()`, or component props `({ name }: { name: string })`) are **STRICTLY PROHIBITED** across the entire codebase — even for 1–2 primitive keys.
- **Always Import Named Interfaces/Types**: Every function parameter, return type, component prop, state object, and query option MUST use an explicit named interface or type imported from its dedicated types file.

```typescript
// ✅ CORRECT: Named interface imported from dedicated types file
import { FetchThreadParams, ThreadSummaryResponse } from '../types/email.types.js';

function fetchThread(params: FetchThreadParams): Promise<ThreadSummaryResponse> { ... }

// ❌ INCORRECT: Inline type definition (even with 1-2 keys)
function fetchThread(params: { emailId: string; accountId: string }): Promise<{ threadId: string }> { ... }

// ❌ INCORRECT: Declaring interface inside a service, controller, hook, or component file
export interface FetchThreadParams { ... } // Must be in a dedicated *.types.ts / *.interface.ts file!
```

---

## 3. Code Size Standards

Line-count rules are **engineering guardrails**, not the primary architectural goal. Do NOT split code merely to reduce line count. Code MUST be split when the file/function/component contains **multiple responsibilities**.

### 3.1 Master Limits

| Code Unit | Preferred Size | Refactoring Trigger | Hard Limit |
|---|---:|---:|---:|
| General source file | ≤200 lines | >200 | 300 |
| React component | ≤150 lines | >150 | 200 |
| Page | ≤180 lines | >180 | 250 |
| Function / Method | ≤30 lines | >30 | 50 |
| Custom hook | ≤80 lines | >80 | 120 |
| React Query file | ≤120 lines | >120 | 180 |
| API client | ≤150 lines | >150 | 200 |
| Service class | ≤200 lines | >200 | 250 |
| Repository class | ≤180 lines | >180 | 250 |
| Controller class | ≤150 lines | >150 | 200 |
| Provider class | ≤250 lines | >250 | 350 |
| Worker | ≤150 lines | >150 | 200 |
| Utility file | ≤100 lines | >100 | 150 |
| Validation file | ≤100 lines | >100 | 200 |
| Model/schema file | ≤150 lines | >150 | 250 |
| Zustand store | ≤150 lines | >150 | 200 |
| Context | ≤150 lines | >150 | 200 |
| Type/interface file | ≤200 lines | >200 | 300 |
| Constants file | ≤200 lines | >200 | 300 |
| Test file | ≤300 lines | >300 | 400 |
| Configuration file | ≤150 lines | >150 | 250 |

### 3.2 Function Parameter Standards

- **Preferred:** ≤4 parameters
- **Hard maximum:** 6 parameters
- If a function requires more than 4 meaningful parameters, use a **named parameter object** (typed interface).

---

## 4. Complexity & Nesting Standards

### 4.1 Cyclomatic Complexity

- **Preferred:** ≤5
- **Maximum:** 10
- If complexity exceeds 5, review for refactoring. If complexity exceeds 10, refactoring is REQUIRED.

### 4.2 Nesting

- **Preferred maximum:** 3 levels
- **Hard maximum:** 4 levels
- Prefer: guard clauses, early returns, extracted functions, strategy pattern, lookup maps.

```typescript
// ✅ CORRECT: Guard clauses + early returns
if (!account) throw new NotFoundError('Account not found');
if (!account.syncEnabled) return;
await syncAccount(account);

// ❌ INCORRECT: Deep nesting
if (account) {
    if (account.syncEnabled) {
        if (account.provider === 'gmail') {
            if (account.accessToken) { ... }
        }
    }
}
```

---

## 5. Backend Architecture Standards

### 5.1 Layered Architecture Flow

```
Route → Validation → Controller → Service → Repository → MongoDB
                                     ↓
                              Provider Interface → Gmail/Outlook → External API

Queue → Worker → Service → Repository / Provider
```

### 5.2 Layer Responsibilities

| Layer | Responsible For | MUST NOT |
|---|---|---|
| **Routes** | HTTP route definitions, middleware registration, validation middleware, controller registration | Contain business logic |
| **Controllers** | Reading request params/body, extracting authenticated user, calling services, returning HTTP responses | Query MongoDB, call Gmail/Outlook/Gemini, contain complex business rules |
| **Services** | Business logic, coordinating repositories/providers/domain services, queue producers, business rules | Directly execute Mongoose queries |
| **Repositories** | ALL MongoDB operations (`find`, `aggregate`, `create`, `update`, `delete`, `bulkWrite`) | Apply business workflows, call providers, format HTTP responses |
| **Providers** | Provider-specific behavior (Gmail/Outlook API interactions) | Contain generic application business logic |
| **Workers** | Background job orchestration, delegating to services | Contain large business workflows directly |

### 5.3 Backend Method Size Limits

| Layer | Preferred | Hard Limit |
|---|---:|---:|
| Controller method | 5–20 lines | 30 lines |
| Service method | 10–30 lines | 50 lines |
| Repository method | 5–25 lines | 40 lines |
| Provider method | 10–40 lines | 60 lines |
| Worker handler | ≤30 lines | 50 lines |

### 5.4 OOP Standards

- Use: Interfaces, dependency injection, composition, encapsulation, polymorphism, strategy/factory/adapter patterns.
- Avoid: God classes, deep inheritance hierarchies, static global state, classes with unrelated responsibilities.
- **Dependency Injection**: Dependencies SHOULD be injected via constructor, not created inline with `new`.

```typescript
// ✅ CORRECT: Constructor injection
class EmailService {
    constructor(
        private readonly emailRepository: EmailRepository,
        private readonly providerFactory: ProviderFactory,
    ) {}
}

// ❌ INCORRECT: Inline instantiation
class EmailService {
    async getEmail(id: string) {
        const repository = new EmailRepository();
        ...
    }
}
```

### 5.5 Module Subdirectory & Barrel Export Architecture

- **Domain-Driven Module Subdirectories:** In Backend modules (`Backend/src/modules/<module>/`), organize source files into standardized, categorized subdirectories to enforce separation of concerns, comply with file size limits, and eliminate root folder clutter:
  - `controllers/`: Thin controller classes/methods (≤150 lines), decomposed by concern (e.g. query vs mutation, settings) + `index.ts`.
  - `services/`: Specialized domain services (≤200 lines, e.g. read, write, sync, oauth) + facade/singletons + `index.ts`.
  - `repositories/`: Pure database access classes (≤180 lines, e.g. entity repo, job repo) + `index.ts`.
  - `models/`: Mongoose schemas, indexes, and compiled models (≤150 lines) + `index.ts`.
  - `schemas/`: Joi/Zod request validation schemas (≤100 lines) + `index.ts`.
  - `interfaces/`: Dedicated module-specific TypeScript interfaces and types (Rule 2.2, zero inline types) + `index.ts`.
  - `routes/`: Express router definitions mounting controllers and validation schemas + `index.ts`.
- **Barrel Exports:** Every subdirectory MUST provide an `index.ts` file that re-exports its public classes, singletons, functions, models, or types. Routes and external consumers import from the folder path (e.g., `import { emailService } from '../services/index.js'`), encapsulating internal file decompositions.
- **Integration Clients & Services:** In external integration modules (e.g. `integrations/gmail/`, `integrations/outlook/`), group multiple specialized clients into a `clients/` folder with `index.ts`, and decomposed services into a `services/` folder with `index.ts`.

---

## 6. Error Handling Standards

Error handling MUST happen at **meaningful architectural boundaries**, not on every function. Do NOT blindly add `try/catch` across the codebase.

### 6.1 Appropriate Architectural Boundaries for try/catch

- **Controllers:** HTTP boundary (wrap request processing, service invocation, and response formatting)
- **Services:** Business logic orchestration (coordinating repositories/providers, catching third-party errors, wrapping in domain exceptions)
- **External Provider Integrations:** External API boundary (calling Google, Microsoft, Auth0, S3, normalizing network/provider errors)
- **Background Workers:** Job boundary (handling processor execution, retry logic, dead-letter logging)
- **API Clients (Frontend):** HTTP client boundary (Axios interceptors/client wrappers normalizing backend error payloads)

### 6.2 Where try/catch is STRICTLY UNNECESSARY & FORBIDDEN

- **Repositories (Backend):** NO `try/catch`. Repositories are pure data access abstractions; queries MUST execute directly so database/Mongoose errors bubble up to services or controllers cleanly.
- **Utility Functions (Backend & Frontend):** NO `try/catch`. Pure utility functions (e.g. `normalizeSubject`, `formatDate`, `calculateMetrics`) perform no I/O and do NOT need `try/catch`.
- **React Components (Frontend):** NO `try/catch`. Components are pure UI rendering layers. Unexpected rendering errors MUST be caught by React Error Boundaries (`ErrorBoundary.tsx`). Never wrap JSX or rendering logic in `try/catch`.
- **Custom Hooks (Frontend):** NO `try/catch`. Hooks orchestrate queries and UI state. Server state errors are managed natively by React Query (`isError`, `error`, `onError` callbacks). Do NOT wrap hook bodies in `try/catch`.

### 6.3 Strict Rules for Boundary try/catch Blocks

- Error handling MUST **add value**. Do not add meaningless `try/catch` blocks solely to satisfy a rule.
- `catch` blocks MUST properly handle errors: log with structured context (`logger.error`), wrap in domain errors, or re-throw.
- Empty `catch` blocks (`catch (e) {}`) are **STRICTLY FORBIDDEN**.
- Swallowing exceptions silently or returning dummy fallbacks is **STRICTLY FORBIDDEN**.

```typescript
// ✅ CORRECT: Meaningful boundary handling in Service
async syncAccount(accountId: string): Promise<void> {
    try {
        const account = await this.accountRepository.getAccount(accountId);
        if (!account) throw new NotFoundError('Account not found');
        await this.provider.syncEmails(account);
    } catch (error) {
        logger.error('Account sync failed', { accountId, error });
        throw error;
    }
}

// ✅ CORRECT: Pure repository method — NO try/catch (bubbles to service)
async getEmail(id: string): Promise<EmailDocument | null> {
    return EmailModel.findById(id).lean();
}

// ✅ CORRECT: Pure utility function — NO try/catch
function normalizeSubject(subject: string): string {
    return subject.trim().replace(/^(Re|Fwd):\s*/i, '');
}

// ❌ INCORRECT: Meaningless try/catch in repository or utility
async getEmail(id: string): Promise<EmailDocument | null> {
    try {
        return await EmailModel.findById(id).lean();
    } catch (error) {
        throw error;
    }
}
```

### 6.3 Domain Error Types

Use meaningful application/domain errors:

```
BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError,
ConflictError, ProviderError, DatabaseError, ExternalServiceError,
ConfigurationError, RateLimitError
```

### 6.4 Logging Standards

- Logs MUST provide useful context: `logger.error('Failed to sync account', { accountId, provider, error })`.
- NEVER log: access tokens, refresh tokens, passwords, OAuth codes, API keys, full email bodies, attachment contents, sensitive user information.

---

## 7. Frontend Architecture Standards

### 7.1 Data Flow

```
Page → Feature Container → Custom Hook → React Query Hook → API Client → Backend API
```

UI rendering MUST remain separated from API communication, business logic, server state, global state, and complex transformations.

### 7.2 Component Standards

- **Preferred:** ≤150 lines. **Hard limit:** 200 lines.
- A component SHOULD have **one primary UI responsibility**. Split into semantic sub-components.
- Component logic (non-JSX) SHOULD be <50 lines, hard limit 100 lines.
- JSX nesting: prefer ≤3 meaningful levels.

### 7.3 Custom Hook Standards

- **Preferred:** ≤80 lines. **Hard limit:** 120 lines.
- Each hook SHOULD have **one purpose** (e.g., `useEmailThread()`, `useSendEmail()`, NOT `useEmailEverything()`).
- Extract when a hook manages multiple unrelated concerns.

### 7.4 React Query Standards

- React Query MUST own server state (emails, accounts, folders, sync state).
- Query files: preferred ≤120 lines, hard limit 180 lines.
- SHOULD contain: query keys, query functions, mutation functions, cache invalidation, query config.
- SHOULD NOT contain: UI rendering, DOM manipulation, unrelated business logic.

### 7.5 Zustand Standards

- Zustand SHOULD be used **only for global client/UI state** (sidebar, selected account, breadcrumbs, UI preferences).
- Do NOT duplicate server state in Zustand when React Query already owns it.

### 7.6 API Client Standards

- API calls MUST NOT be written directly inside React components.
- Flow: `Component → useHook() → apiClient.method() → HTTP Client → Backend`.
- API clients handle: HTTP requests, request serialization, response typing, error normalization.

### 7.7 Event Handler Standards

- **Preferred:** 5–20 lines. **Hard limit:** 30 lines.
- Complex handlers MUST be moved into custom hooks, feature actions, or utility functions.

### 7.8 `useEffect` Standards

- Do NOT use `useEffect` for derived values. Use computed values directly.
- Use effects primarily for synchronization with external systems (browser APIs, WebSockets, event listeners).

### 7.9 Page Standards

- **Preferred:** ≤180 lines. **Hard limit:** 250 lines.
- Pages orchestrate: layout, feature components, page-level hooks, routing parameters, loading/error state.
- Pages MUST NOT contain large business algorithms.

---

## 8. File & Directory Naming Standards

Every file and directory across the MailSense project MUST adhere to standard, predictable naming conventions.

### 8.1 Universal Directory Naming Standard (100% Strict Kebab-Case)

- **Rule:** Every directory across both Backend and Frontend MUST be strictly lowercase **`kebab-case`**.
- **Examples:**
  - ✅ `modules/emails/`
  - ✅ `modules/accounts/`
  - ✅ `features/inbox/`
  - ✅ `features/email-thread/`
  - ✅ `shared/components/`
  - ❌ `features/composeEmail/` *(NEVER use camelCase or PascalCase for directories)*

### 8.2 Backend File Naming (`kebab-case.<role>.ts`)

- **Rule:** Every backend file MUST use lowercase **`kebab-case`** with a dot-separated **architectural role suffix**.

| Layer / File Type | Convention | Example |
|---|---|---|
| **Controller** | `<entity>-<concern>.controller.ts` | `email-query.controller.ts`, `account-settings.controller.ts` |
| **Service** | `<entity>-<concern>.service.ts` | `email-read.service.ts`, `account-oauth.service.ts` |
| **Repository** | `<entity>.repository.ts` | `email.repository.ts`, `sync-job.repository.ts` |
| **Model** | `<entity>.model.ts` | `email.model.ts`, `sync-job.model.ts` |
| **Validation Schema** | `<entity>-<concern>.schema.ts` | `email-query.schema.ts`, `account.schema.ts` |
| **Routes** | `<entity>.routes.ts` | `email.routes.ts`, `account.routes.ts` |
| **Interface / Types** | `<entity>.interface.ts` (or `.types.ts`) | `email.interface.ts`, `account.interface.ts` |
| **Constants** | `<entity>.constants.ts` | `email.constants.ts`, `gmail.constants.ts` |
| **Utilities** | `<name>.utils.ts` | `crypto.utils.ts`, `compression.utils.ts` |
| **Worker / Job** | `<entity>-<job>.worker.ts` | `sync-processor.worker.ts` |
| **Barrel Export** | `index.ts` | `index.ts` |

### 8.3 Frontend File Naming Standards

- **React Components (`PascalCase.tsx`):** Every React UI component file MUST use **`PascalCase.tsx`** matching the exported component symbol (e.g. `EmailCard.tsx`, `MoveToFolderDropdown.tsx`).
- **Custom Hooks (`camelCase.ts`):** Every custom hook MUST use **`camelCase.ts`** with a `use` prefix (e.g. `useInboxPage.ts`, `useEmailActions.ts`).
- **React Query Files:** `<entity>.queries.ts` (e.g. `inbox.queries.ts`, `emails.queries.ts`).
- **API Client Files:** `<entity>.api.ts` (e.g. `emails.api.ts`, `accounts.api.ts`).
- **Dedicated Types Files:** `<entity>.types.ts` (e.g. `email.types.ts`, `inbox.types.ts`).
- **Zustand Stores:** `<name>.store.ts` (e.g. `sidebar.store.ts`).
- **Shared Utilities:** `<name>.utils.ts` (e.g. `format-date.utils.ts`).
- **Next.js App Router Files:** Strictly lowercase Next.js invariant filenames (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`).

### 8.4 Anti-Pattern: Anonymous `index.tsx` Components

- **Avoid Generic `index.tsx` Component Files:** Do NOT create component directories containing only an anonymous `index.tsx` (e.g. `folder-email-list-header/index.tsx`). This causes multiple ambiguous `index.tsx` tabs in IDEs and breaks quick-open search.
- **Do Instead:** Name the file directly as `FolderEmailListHeader.tsx`. If a component requires its own subdirectory for sub-components, name the primary component `folder-email-list-header/FolderEmailListHeader.tsx` and export it via `folder-email-list-header/index.ts`.

### 8.5 Git Case-Sensitivity Guardrail

- Never rename files only by changing character casing on macOS without using `git mv` (e.g., `git mv oldname.ts OldName.ts`), as case-insensitive OS filesystems will miss the change, causing CI/CD breakage on Linux.

---

## 9. Centralized Constants

- **No Hardcoded Endpoints/URLs**: Do NOT hardcode API endpoint strings or URL paths directly inside client or provider integration methods.
- **Use Module Constants**: Always export and import centralized constants (e.g., `GMAIL_APIs`, `OUTLOOK_APIs`, `EMAILS_API_ENDPOINTS`).

---

## 10. Refactoring Triggers — Master List

A refactoring review SHOULD happen when any of these occur:

| Trigger | Threshold |
|---|---|
| File length | >200 lines |
| Function/method | >30 lines |
| Component | >150 lines |
| Hook | >80 lines |
| Page | >180 lines |
| Service class | >200 lines |
| Repository class | >180 lines |
| Controller class | >150 lines |
| Provider class | >250 lines |
| Worker | >150 lines |
| Cyclomatic complexity | >5 |
| Nesting depth | >3 levels |
| Function parameters | >4 |
| Same logic duplicated | 2+ times (review); 3+ times (extract) |
| Controller contains business logic | Always |
| Service contains database queries | Always |
| Component directly calls APIs | Always |
| Hook manages unrelated concerns | Always |
| Server state duplicated in Zustand | Always |

---

## 11. Code Duplication Rules

```
1 occurrence   → Keep local
2 occurrences  → Review for common abstraction
3+ occurrences → Strong candidate for extraction
```

Do NOT create abstractions merely to eliminate a few duplicated lines if the abstraction makes the code harder to understand. Prefer meaningful abstraction names (`EmailNormalizer`, `ProviderFactory`) over vague ones (`GenericProcessor`, `UniversalManager`, `CommonHelper`).

---

## 12. Security Rules

- Never expose: OAuth tokens, refresh tokens, passwords, authorization codes, API keys/secrets.
- Do not log sensitive email content or attachment contents.
- Maintain: authentication, authorization, user data isolation, provider account isolation, input validation, secure token handling.
- Refactoring MUST NOT weaken security posture.

---

## 13. Performance Rules

**Backend:**
- Avoid N+1 queries
- Use proper indexes, projections, pagination, bulk operations
- Avoid unnecessary DB round trips and uncontrolled concurrency
- Avoid loading large email bodies unnecessarily

**Frontend:**
- Avoid unnecessary renders
- Use React Query caching
- Avoid unnecessary effects
- Use pagination/infinite loading appropriately
- Memoize only when there is a measurable rendering reason

---

## 14. Anti-Patterns

### Backend Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|---|---|
| God Service / God Repository / God Controller | Small, focused, single-responsibility classes |
| Database query inside service or controller | ALL queries in repository methods |
| Provider API call inside controller | Call via service → provider interface |
| Business logic inside controller or route | Keep controllers thin, services contain logic |
| Static global state, deep inheritance | Composition, dependency injection, interfaces |
| Meaningless `try/catch` on pure functions | Handle errors at architectural boundaries only |

### Frontend Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|---|---|
| God Component / God Hook | Split into focused components and hooks |
| API call inside component | Use React Query hooks + API clients |
| Business logic inside JSX | Extract to hooks or utilities |
| Server state inside Zustand | React Query owns server state |
| Huge `useEffect` / multiple unrelated effects | Extract into purpose-specific hooks |
| Deep JSX nesting (>3 levels) | Extract semantic sub-components |
| Large inline callbacks (>20 lines) | Extract to named handlers in hooks |