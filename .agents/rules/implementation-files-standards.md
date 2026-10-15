---
trigger: always_on
---

# Feature Implementation Files Standards

> **Scope:** All detailed phase implementation documents generated in the `.agents/implementations/{feature}/` directory across the MailSense project.
> **Location:** Implementation detail files MUST live under `mailsense/.agents/implementations/<feature-name>/` — e.g. `phase-1-thread-view.md`, `phase-2-attachments.md`.

---

## 1. File Organization & Canonical Path

### 1.1 Directory Structure & Naming Convention

Implementation detail files MUST be placed in feature-specific subdirectories under `.agents/implementations/`:

```
mailsense/.agents/implementations/<feature-name>/
├── phase-1-<phase-name>.md                  ← Phase 1 Detailed Implementation Document
├── phase-2-<phase-name>.md                  ← Phase 2 Detailed Implementation Document
└── ...
```

- Feature directories MUST use **kebab-case** (e.g. `email-experience-completion`, `background-sync`).
- Implementation files MUST follow the pattern `phase-<N>-<phase-name>.md` (e.g. `phase-1-thread-view.md`).
- Each phase file MUST be a **single self-contained markdown file** that provides complete, production-grade code implementation details for that phase.

---

## 2. Mandatory Core Code Rules & Constraints

All code snippets and implementations documented in `.agents/implementations/{feature}/` MUST strictly adhere to the following rules:

### 2.1 Two Main Code Sections (Backend First, then Frontend)

Every implementation document MUST organize code changes into **two main sections** in strict order:

1. **Main Section 1: Backend Layer Implementation** (`Backend/src/...`)
   - Mongoose Schemas & Models
   - Repositories (`*.repository.ts`)
   - Services (`*.service.ts`)
   - Controllers (`*.controller.ts`)
   - Validation Schemas & Routes (`*.schema.ts`, `*.routes.ts`)
2. **Main Section 2: Frontend Layer Implementation** (`Frontend/src/...`)
   - Endpoint Definitions (`shared/api/endpoints.ts`)
   - API Client Wrappers (`features/*/api/*.api.ts`)
   - React Query Hooks (`features/*/api/*.queries.ts`)
   - Custom Hooks & Page Logic (`features/*/hooks/use*.ts`)
   - UI Components & Views (`features/*/components/...`, `pages/...`)

_(Note: Shared type contract updates in `@mailsense/types` should be referenced at the beginning of the Backend section if applicable)._

### 2.2 Meaningful Boundary-Based Error Handling

- Error handling MUST happen at **meaningful architectural boundaries**, not blindly on every function.
- **Mandatory Boundaries for `try / catch`:**
  - **Controllers (HTTP boundary):** Wrap request extraction, service calls, and response rendering.
  - **Services (Business boundary):** Orchestrate repositories/providers, catch third-party exceptions, wrap in domain errors.
  - **Provider Integrations (API boundary):** External Google, Microsoft, Auth0, S3 calls; normalize third-party errors.
  - **API Clients (HTTP client boundary):** Wrap Axios/Fetch calls; normalize API error payloads.
  - **Background Workers (Job boundary):** Handle processor execution, job retry policies, failed job logging.
- **Where `try / catch` is STRICTLY UNNECESSARY & FORBIDDEN:**
  - **Repositories (Backend):** NO `try/catch`. Pure database access queries must execute directly so errors bubble up naturally to services/controllers.
  - **Utilities (Backend & Frontend):** NO `try/catch`. Pure utility functions (formatting, date calculations, string normalization) perform no I/O.
  - **React Components (Frontend):** NO `try/catch`. UI rendering layer errors are caught by React Error Boundaries (`ErrorBoundary.tsx`). Never wrap JSX or component bodies in `try/catch`.
  - **Custom Hooks (Frontend):** NO `try/catch`. Server state errors are managed natively by React Query (`isError`, `error`, `onError`).
- **Strict Error Handling Rules**:
  - `catch` blocks MUST properly handle errors (logging with structured context via `logger.error`, wrapping and re-throwing domain errors, or delegating to Express error middleware).
  - Empty `catch` blocks (`catch (e) {}`) are **STRICTLY FORBIDDEN**.
  - Swallowing exceptions silently or returning dummy empty objects/ArrayBuffers to conceal failures is **STRICTLY FORBIDDEN**.

```typescript
// ✅ CORRECT: Meaningful boundary handling in Service
public static async getThread(emailId: string): Promise<GetThreadResponse> {
  try {
    const email = await EmailRepository.getEmail(emailId);
    if (!email) {
      throw new NotFoundError(`Email with ID ${emailId} not found`);
    }
    const threadEmails = await EmailRepository.getEmailsByThreadId(email.threadId, email.accountId);
    const decompressed = threadEmails.map((msg) => decompressEmailBody(msg));
    return { thread: decompressed, threadId: email.threadId };
  } catch (error) {
    logger.error('Failed to retrieve email thread', { emailId, error });
    throw error;
  }
}

// ✅ CORRECT: Repository method — NO try/catch (bubbles up to service)
public static async getEmail(emailId: string): Promise<EmailDocument | null> {
  return Email.findById(emailId).lean();
}

// ✅ CORRECT: Pure utility function — NO try/catch
export function normalizeSubject(subject: string): string {
  return subject.trim().replace(/^(Re|Fwd):\s*/i, '');
}

// ❌ INCORRECT: Meaningless try/catch in repository or utility
public static async getEmail(emailId: string): Promise<EmailDocument | null> {
  try {
    return await Email.findById(emailId).lean();
  } catch (error) {
    throw error;
  }
}
```

### 2.3 Strict Type Safety (No `any`, `never`, or `unknown`)

- **No `any`**: The `any` type is strictly prohibited under all circumstances.
- **No `never`**: Avoid `never` unless representing unreachable code blocks in exhaustive switch checks. Do not use it as a return type or variable placeholder.
- **No `unknown`**: Do not use `unknown` in place of proper TypeScript interfaces, DTOs, or generic constraints. For `catch (error)` parameters, use standard error narrowing (e.g., `error instanceof Error ? error.message : String(error)`).
- **Strict Generic Parameters**: All generic parameters, API response payloads, and database queries MUST be typed using explicit contracts (e.g. `AxiosResponse<ApiResponse<EmailAttributes>>`).

### 2.4 Dedicated Types Files Only (No Types in Feature/Code Files)

- **Dedicated Types Files Required**: All TypeScript types, interfaces, enums, and DTOs MUST be declared **exclusively** inside dedicated types files:
  - **Shared contracts** (backend & frontend): MUST reside in `@mailsense/types` (`mailsense-types/src/...`).
  - **Frontend-specific types**: MUST reside in dedicated feature types files (e.g. `Frontend/src/features/<feature>/types/<name>.types.ts` or `Frontend/src/shared/types/...`).
  - **Backend-specific types**: MUST reside in dedicated module interface files (e.g. `Backend/src/modules/<module>/<name>.interface.ts` or `Backend/src/core/types/...`).
- **Forbidden Locations for Type Declarations**: NEVER declare `interface` or `type` definitions inside components (`*.tsx`), custom hooks (`use*.ts`), controllers (`*.controller.ts`), services (`*.service.ts`), repositories (`*.repository.ts`), or utilities (`*.utils.ts`).

### 2.5 Strictly Zero Inline Types Anywhere in Entire Codebase

- **No Inline Object Types**: Inline object type definitions (e.g. `param: { id: string }`, `options: { force?: boolean }`, `useState<{ count: number }>()`, or component props `({ name }: { name: string })`) are **STRICTLY PROHIBITED** across the entire codebase — even for 1–2 primitive keys.
- **Always Import Named Interfaces/Types**: Every function parameter, return type, component prop, state object, and query option MUST use an explicit named interface or type imported from its dedicated types file.

```typescript
// ✅ CORRECT: Named interface imported from dedicated types file
import { FetchThreadParams, GetThreadResponse } from '../types/email.types.js';

export async function fetchThread(params: FetchThreadParams): Promise<GetThreadResponse> { ... }

// ❌ INCORRECT: Inline object type (even with 1-2 keys)
export function formatRecipient(input: { email: string; name: string }): string { ... }

// ❌ INCORRECT: Declaring interface inside a service, controller, hook, or component file
export interface FetchThreadParams { ... } // Must be in a dedicated *.types.ts / *.interface.ts file!
```

### 2.6 Centralized Constants for API Endpoints

- **No Hardcoded Endpoints/URLs**: Do NOT hardcode API endpoint strings or URL paths directly inside client or provider integration methods (e.g., `${GMAIL_API_BASE_URL}/users/me/messages/batchModify`, `${OUTLOOK_API_BASE_URL}/me/messages/${id}/move`, or hardcoded API route strings).
- **Use Module Constants**: Always export and import centralized constants (e.g., `GMAIL_APIs`, `OUTLOOK_APIs`, `EMAILS_API_ENDPOINTS`) and concatenate base URLs with exported constant properties or helper functions (e.g. `${GMAIL_API_BASE_URL}${GMAIL_APIs.BATCH_MODIFY}`, `${OUTLOOK_API_BASE_URL}${OUTLOOK_APIs.MOVE_MESSAGE(messageId)}`).

```typescript
// ✅ CORRECT: Using centralized constants for API endpoint URLs
const options: AxiosRequestConfig = {
  url: `${GMAIL_API_BASE_URL}${GMAIL_APIs.BATCH_MODIFY}`,
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
};

// ❌ INCORRECT: Hardcoded URL string inline in integration client
const options: AxiosRequestConfig = {
  url: `${GMAIL_API_BASE_URL}/users/me/messages/batchModify`,
  method: 'POST',
};
```

### 2.7 Code Size, Complexity & Nesting Standards

All proposed implementations must comply with the engineering guardrails defined in [MailSense Coding Standards](file:///Users/vishaljagamani/Projects/Projects/mailsense/.agents/rules/coding-standards.md):

- **File Length Limits:**
  - React Component: Preferred ≤150 lines, hard limit 200 lines.
  - Page Component: Preferred ≤180 lines, hard limit 250 lines.
  - Custom Hook: Preferred ≤80 lines, hard limit 120 lines.
  - React Query File: Preferred ≤120 lines, hard limit 180 lines.
  - Controller Class: Preferred ≤150 lines, hard limit 200 lines.
  - Service Class: Preferred ≤200 lines, hard limit 250 lines.
  - Repository Class: Preferred ≤180 lines, hard limit 250 lines.
  - Provider / Client Class: Preferred ≤250 lines, hard limit 350 lines.
  - Utility File: Preferred ≤100 lines, hard limit 150 lines.
- **Function / Method Limits:**
  - Length: Preferred ≤30 lines, hard limit 50 lines.
  - Parameters: Preferred ≤4 parameters, hard limit 6 (use named interface objects beyond 4).
  - Nesting Depth: Preferred ≤3 levels, hard limit 4 levels (use early returns and guard clauses).
  - Cyclomatic Complexity: Preferred ≤5, hard limit 10.

### 2.8 Standardized Folder Structure & Naming Conventions

All planned implementations MUST strictly adhere to the standardized directory structure and naming conventions:

- **Universal Directory Naming**: Every directory across Backend and Frontend MUST be strictly lowercase **`kebab-case`** (e.g. `features/compose-email/`, NOT `composeEmail/`).
- **Backend Module Subdirectory Architecture**: Decomposed modules MUST organize files into categorized subdirectories with barrel exports (`index.ts`):
  - `controllers/`: `<entity>-<concern>.controller.ts` + `index.ts`
  - `services/`: `<entity>-<concern>.service.ts` + `index.ts`
  - `repositories/`: `<entity>.repository.ts` + `index.ts`
  - `models/`: `<entity>.model.ts` + `index.ts`
  - `schemas/`: `<entity>-<concern>.schema.ts` + `index.ts`
  - `interfaces/`: `<entity>.interface.ts` (strictly dedicated types files) + `index.ts`
  - `routes/`: `<entity>.routes.ts` + `index.ts`
- **Backend Integration Clients & Services**: Organized into `clients/` and `services/` with `index.ts`.
- **Frontend File Naming Standards**:
  - React Components: Strictly **`PascalCase.tsx`** matching component export (e.g. `EmailCard.tsx`, `FolderEmailListHeader.tsx`).
  - Custom Hooks: Strictly **`camelCase.ts`** with `use` prefix (e.g. `useInboxPage.ts`, `useEmailActions.ts`).
  - React Query Files: `<entity>.queries.ts` (e.g. `inbox.queries.ts`).
  - API Client Files: `<entity>.api.ts` (e.g. `emails.api.ts`).
  - Dedicated Types Files: `<entity>.types.ts` (e.g. `email.types.ts`).
- **Elimination of Anonymous `index.tsx`**: Never create anonymous component files like `folder-email-list-header/index.tsx`. Name the file directly as `FolderEmailListHeader.tsx`.

---

## 3. Mandatory Implementation Document Structure

Every `.agents/implementations/<feature-name>/phase-<N>-<phase-name>.md` file MUST follow this structure:

````markdown
# <Feature Name> - Phase <N> Implementation Details

> **Feature:** <feature-name> · **Phase:** <N>
> **Status:** <DRAFT | IN PROGRESS | COMPLETED>
> **Created:** <YYYY-MM-DD> · **Last Updated:** <YYYY-MM-DD>

---

## 1. Goal Description & Scope

<Concise summary of what this phase accomplishes and what components are impacted.>

---

## 2. User Review Required & Architectural Notes

> [!IMPORTANT]
> <Key architectural choices, edge cases, data isolation, and performance considerations.>

---

## 3. Component Overview & File Map

| Component | Target File                 | Action   | Purpose             |
| --------- | --------------------------- | -------- | ------------------- |
| Backend   | `Backend/src/modules/...`   | [MODIFY] | Add service method  |
| Frontend  | `Frontend/src/features/...` | [NEW]    | Add React component |

---

## 4. Main Section 1: Backend Layer Implementation

### 4.1 Repository Layer (`Backend/src/modules/<module>/<name>.repository.ts`)

### 4.2 Service Layer (`Backend/src/modules/<module>/<name>.service.ts`)

### 4.3 Controller Layer (`Backend/src/modules/<module>/<name>.controller.ts`)

### 4.4 Routes & Validation Schemas (`Backend/src/modules/<module>/<name>.routes.ts`)

---

## 5. Main Section 2: Frontend Layer Implementation

### 5.1 Endpoints & API Client (`Frontend/src/shared/api/endpoints.ts`, `Frontend/src/features/<feature>/api/<name>.api.ts`)

### 5.2 React Query Hooks (`Frontend/src/features/<feature>/api/<name>.queries.ts`)

### 5.3 Custom Hooks & State (`Frontend/src/features/<feature>/hooks/use<Name>.ts`)

### 5.4 UI Components & Page Integration (`Frontend/src/features/<feature>/components/`, `pages/`)

---

## 6. Low-Level Design & Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend
    participant Controller
    participant Service
    participant Repository
    participant DB
    ...
```
````

---

## 7. Step-by-Step Task Checklist

- [ ] Task 1: Backend Repository & Service implementation
- [ ] Task 2: Backend Controller & Route setup
- [ ] Task 3: Frontend API & Hook integration
- [ ] Task 4: Frontend Component & Page integration
- [ ] Task 5: Verification & Testing

---

## 8. Verification & Build Commands

```bash
# Backend Verification
cd Backend && pnpm build

# Frontend Verification
cd Frontend && npx tsc --noEmit
```

---

## 4. Layered Implementation Best Practices

### 4.1 Backend Architecture Guidelines

1. **Repository Layer**: All database calls MUST be written and executed exclusively within the Repository Layer. Services, controllers, and other application layers MUST NOT directly access Mongoose models or execute database queries. Encapsulate all Mongoose queries (`Email.find`, `Email.aggregate`, etc.) in repository methods.
2. **Service Layer**: Business logic, data decompression, permission checks. Wrap in `try / catch`, throwing custom domain errors (`NotFoundError`, `BadRequestError`, `UnauthorizedError`).
3. **Controller Layer**: Handle HTTP request extraction (`req.params`, `req.body`), invoke services, and return standard JSON HTTP response objects. Every controller method MUST be wrapped in `try / catch`.
4. **Routes Layer**: Attach validation middleware schemas (`joi` or `zod` schemas) and standard request wrapper (`handleRequest`).

### 4.2 Frontend Architecture Guidelines

1. **API Endpoints**: Centralize all REST routes in `endpoints.ts`.
2. **API Client Layer**: Pure async functions returning strongly-typed Promises (`Promise<T>`). Must wrap Axios/Fetch calls in `try / catch` and format API errors.
3. **React Query Hooks**: Wrap API functions in `useQuery` / `useMutation` with explicit query keys and invalidation logic. Handle error state callbacks in `onError` or try/catch within mutations.
4. **UI Components & Pages**: Keep rendering logic modular. Always type props with named interfaces (`ThreadViewProps`). Implement error boundaries and loading skeleton fallbacks.

---

## 5. Anti-Patterns to Avoid

| ❌ Don't                                                                                | ✅ Do Instead                                                                        |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Use `any`, `never`, or `unknown` anywhere in codebase                                   | Define and import explicit interfaces/types from dedicated types files               |
| Define inline object types anywhere (even 1–2 keys like `{ id: string }`)             | Strictly define and import named interfaces/types from dedicated types files         |
| Declare `interface` or `type` inside component, hook, service, controller, repo, utils  | Declare all types exclusively in dedicated `*.types.ts` or `*.interface.ts` files     |
| Wrap `try/catch` in repositories, utilities, React components, or custom hooks          | Handle errors at architectural boundaries only (controllers, services, providers)   |
| Place Backend after Frontend or mix them together                                       | Always put **Backend** implementation first, followed by **Frontend** implementation |
| Document truncated pseudocode (`// implement later`)                                    | Provide complete, copy-pasteable, production-ready TypeScript code snippets          |
| Hardcode API endpoint strings directly inside client integration code                   | Export and reference centralized constants (`GMAIL_APIs`, `OUTLOOK_APIs`, `EMAILS_API_ENDPOINTS`) |
| Create God components (>150 lines) or God hooks (>80 lines)                             | Decompose into small, focused sub-components and single-purpose hooks                |
| Write functions exceeding 30–50 lines or nesting depth >3–4                             | Refactor with guard clauses, early returns, and extracted helper methods             |
| Call APIs directly inside React components                                              | Use React Query hooks (`useQuery` / `useMutation`) via feature API clients           |
| Query MongoDB models directly inside services or controllers                            | Encapsulate all database queries inside Repository methods                           |
| Duplicate server state in Zustand                                                       | React Query owns server state; Zustand is restricted to UI/client state              |
| Use camelCase or PascalCase for directories (e.g. `composeEmail/`)                      | Strictly use lowercase `kebab-case` for all directories                              |
| Create anonymous `index.tsx` component directories (`folder-email-list-header/index.tsx`)| Name component files directly in `PascalCase.tsx` (`FolderEmailListHeader.tsx`)      |
| Place all module files flat at module root when scaling                                 | Group into categorized subdirectories (`controllers/`, `services/`, etc.) + `index.ts`|
