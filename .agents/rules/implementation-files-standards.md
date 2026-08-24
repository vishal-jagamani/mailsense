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

### 2.2 Strict Try-Catch Block Requirement on Every Function

- **Every single function and method** (service methods, controller handlers, API wrapper functions, custom hooks, event listeners, background workers) MUST contain an explicit `try / catch` block.
- **Error Handling Standards**:
  - `catch` blocks MUST properly handle errors (e.g. logging with context, wrapping and re-throwing domain/HTTP errors, or passing to error middleware).
  - Empty `catch` blocks (`catch (e) {}`) are **STRICTLY FORBIDDEN**.
  - Swallowing exceptions silently or returning dummy empty objects/ArrayBuffers to conceal failures is **STRICTLY FORBIDDEN**.

```typescript
// ✅ CORRECT: Comprehensive try/catch handling with logging and error propagation
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

// ❌ INCORRECT: Missing try/catch block
public static async getThread(emailId: string): Promise<GetThreadResponse> {
  const email = await EmailRepository.getEmail(emailId);
  return { thread: [], threadId: email.threadId };
}
```

### 2.3 Strict Type Safety (No `any`, `never`, or `unknown`)

- **No `any`**: The `any` type is strictly prohibited under all circumstances.
- **No `never`**: Avoid `never` unless representing unreachable code blocks in exhaustive switch checks. Do not use it as a return type or variable placeholder.
- **No `unknown`**: Do not use `unknown` in place of proper TypeScript interfaces, DTOs, or generic constraints. For `catch (error)` parameters, use standard error narrowing (e.g., `error instanceof Error ? error.message : String(error)`).
- **Strict Generic Parameters**: All generic parameters, API response payloads, and database queries MUST be typed using explicit contracts (e.g. `AxiosResponse<ApiResponse<EmailAttributes>>`).

### 2.4 No Inline Types (Unless Max 1 or 2 Primitive Keys)

- **Named Interfaces Required**: Do NOT define inline object type signatures with 3 or more properties in function arguments, return types, component props, or service methods. Always define and import named TypeScript interfaces/types from `@mailsense/types` or feature interface files.
- **Single Exception**: Inline object type definitions are permitted **ONLY** if they contain a maximum of 1 or 2 primitive keys (e.g., `{ id: string; name: string }` or `{ email: string; isPrimary: boolean }`).

```typescript
// ✅ CORRECT: Named interface for complex object structures
export interface FetchThreadParams {
  emailId: string;
  accountId: string;
  includeAttachments: boolean;
  pageLimit: number;
}

export async function fetchThread(params: FetchThreadParams): Promise<GetThreadResponse> { ... }

// ✅ CORRECT: Inline type allowed because it has at most 2 primitive keys
export function formatRecipient(input: { email: string; name: string }): string { ... }

// ❌ INCORRECT: Inline object type with 3+ keys
export function fetchThread(params: { emailId: string; accountId: string; includeAttachments: boolean }): Promise<void> { ... }
```

### 2.5 Centralized Constants for API Endpoints

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
| Use `any`, `never`, or `unknown` as type placeholders                                   | Define and import explicit interfaces from `@mailsense/types`                        |
| Pass inline object types with $\ge 3$ keys (e.g. `{ a: string, b: string, c: string }`) | Define a named interface (e.g. `export interface Params { ... }`)                    |
| Place Backend after Frontend or mix them together                                       | Always put **Backend** implementation first, followed by **Frontend** implementation |
| Document truncated pseudocode (`// implement later`)                                    | Provide complete, copy-pasteable, production-ready TypeScript code snippets          |
| Hardcode API endpoint strings directly inside client integration code                   | Export and reference centralized constants (`GMAIL_APIs`, `OUTLOOK_APIs`, `EMAILS_API_ENDPOINTS`) |
