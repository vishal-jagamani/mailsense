---
trigger: always_on
---

# Codebase Health Audit Analysis Standards

> **Scope:** All codebase health audit report generations and updates for the MailSense project.
> **Location:** Audit reports MUST live at `mailsense/.agents/plans/codebase-health-audit-report.md`.

---

## 1. Audit Trigger & Cadence

A codebase health audit SHOULD be performed:

- Before starting any **new major feature** (e.g., AI module, notifications system)
- After completing a **multi-phase implementation** spanning 5+ files
- When the last audit is **≥2 weeks old** and active development has continued
- When the user explicitly requests an audit

---

## 2. Mandatory Audit Dimensions

Every health audit MUST evaluate ALL of the following dimensions. Do NOT skip any dimension.

### 2.1 Previous Audit Verification

- Verify ALL remediation items from the previous audit version are resolved.
- For each item, provide: **Finding ID**, **Title**, **Status** (✅ RESOLVED / ⚠️ PARTIALLY / ❌ UNRESOLVED), **Verification** (file link + evidence).
- Any item marked PARTIALLY or UNRESOLVED MUST be re-documented as a new finding.

### 2.2 Security & Multi-Tenant Isolation

Check for:
- IDOR vulnerabilities (missing userId/ownership verification in controllers/services)
- OAuth token exposure in API responses
- Static file exposure (`express.static` scoping)
- Commented-out security checks (authorization, validation)
- `console.log` leaking sensitive data in production
- Proper Helmet CSP and rate limiting configuration

### 2.3 Code Size Standards Compliance

Measure every source file against the code size standards defined in `coding-standards.md`:

| Code Unit | Refactoring Trigger | Hard Limit |
|---|---:|---:|
| General source file | >200 lines | 300 |
| React component | >150 lines | 200 |
| Page | >180 lines | 250 |
| Function / Method | >30 lines | 50 |
| Custom hook | >80 lines | 120 |
| Service class | >200 lines | 250 |
| Repository class | >180 lines | 250 |
| Controller class | >150 lines | 200 |
| Provider class | >250 lines | 350 |
| Worker | >150 lines | 200 |
| Utility file | >100 lines | 150 |

Report files exceeding thresholds with: file path, current lines, category, and specific refactoring recommendation.

### 2.4 Function & Method Size Analysis

- Identify functions/methods exceeding the **30-line preferred** or **50-line hard limit**.
- Check cyclomatic complexity (flag >5 preferred, >10 hard limit).
- Check nesting depth (flag >3 preferred, >4 hard limit).
- Check parameter count (flag >4 preferred, >6 hard limit).

### 2.5 Architecture & OOP Patterns

Evaluate:
- Layer separation compliance (controller → service → repository → model)
- Database access exclusively within repositories (no Mongoose in services/controllers)
- Provider integration via interface pattern (`IEmailProvider`)
- Dependency injection vs inline `new` instantiation
- Static vs instance method consistency across similar classes
- Empty/dead constructors
- God classes or classes with unrelated responsibilities

### 2.6 Code Duplication & DRY

- Identify logic duplicated 2+ times across different files
- Flag 3+ occurrences as strong extraction candidates
- Measure duplication by line count and responsibility overlap
- Recommend specific extraction targets (shared hooks, helper methods, utility functions)

### 2.7 Exception Handling & Logging

- Verify error handling occurs ONLY at meaningful architectural boundaries:
  - Controllers (HTTP boundary)
  - Services (business logic & domain error wrapping)
  - Provider integrations (external API boundary)
  - Background workers (job boundary)
  - API clients (HTTP client boundary)
- Flag and prohibit `try/catch` in layers where it is strictly unnecessary and forbidden:
  - **Repositories (Backend):** Queries must execute directly so errors bubble up naturally.
  - **Utilities (Backend & Frontend):** Pure functions perform no I/O.
  - **React Components (Frontend):** UI rendering is caught by React Error Boundaries (`ErrorBoundary.tsx`).
  - **Custom Hooks (Frontend):** Server state is managed natively by React Query (`isError`, `error`).
- Check for `console.log` / `console.error` usage — should use structured logger (backend) or monitoring (`trackUserAction()` on frontend)
- Verify domain error types are used (not generic `new Error()`)
- Check that sensitive data is never logged

### 2.8 Type Safety & Contract Integrity

- Scan for `any`, `never`, `unknown` type usage (strictly forbidden under all circumstances).
- Enforce **dedicated types files only**: Verify all types, interfaces, enums, and DTOs live in `*.types.ts` or `*.interface.ts` files. Flag any type declarations inside components, hooks, services, controllers, repositories, or utilities.
- Enforce **strictly zero inline types**: Flag any inline object type signatures anywhere across the entire codebase (even 1–2 primitive keys). All types must be named interfaces/types imported from dedicated types files.
- Verify `@mailsense/types` contracts are accurate and consumed correctly across backend and frontend.
- Flag ambiguous union types (e.g., `string[] | string` should be normalized).

### 2.9 Frontend-Specific Checks

- React Query ownership of server state (no server state in Zustand)
- Component responsibility (single UI concern per component)
- Hook responsibility (single purpose per hook)
- API calls never directly in components
- Business logic never inside JSX
- `useEffect` not used for derived values
- Proper error boundaries and loading skeletons

### 2.10 Performance & Database

- N+1 query detection
- Missing indexes on queried fields
- Unnecessary data loading (e.g., full email bodies when only metadata needed)
- Proper pagination and streaming for large datasets
- Rate limiting configuration for external APIs

### 2.11 Folder Structure & Naming Conventions Standards Compliance

- **Universal Directory Naming**: Verify that ALL directories in Backend and Frontend use strictly lowercase `kebab-case` (flag any camelCase directories like `composeEmail/`).
- **Backend Module Subdirectory Architecture**: Verify Backend feature modules follow the standardized categorized subdirectories pattern (`controllers/`, `services/`, `repositories/`, `models/`, `schemas/`, `interfaces/`, `routes/`) with barrel exports (`index.ts`).
- **Backend Integration Subdirectories**: Verify integration clients and services are organized in `clients/` and `services/` with `index.ts`.
- **Backend File Naming**: Verify all backend files use `kebab-case.<role>.ts` (`email-query.controller.ts`, `sync-job.repository.ts`, etc.).
- **Frontend Component Naming**: Verify all React UI components use `PascalCase.tsx` (`EmailCard.tsx`, `MoveToFolderDropdown.tsx`).
- **Frontend Hook Naming**: Verify all custom hooks use `camelCase.ts` with `use` prefix (`useInboxPage.ts`).
- **Elimination of Anonymous `index.tsx`**: Flag and eliminate nested component directories containing only generic `index.tsx` (e.g., `folder-email-list-header/index.tsx`); replace with explicit component naming (`FolderEmailListHeader.tsx`).
- **Case-Sensitivity Guardrail**: Check that Git tracks case sensitivity (`git config core.ignorecase false`) and all case changes use `git mv`.

---

## 3. Mandatory Audit Report Structure

Every audit version MUST follow this structure:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### 📋 File Audit Details
| Field | Value |
|-------|-------|
| **Created** | YYYY-MM-DD HH:MM TZ |
| **Last Updated** | YYYY-MM-DD HH:MM TZ |

### 📦 Repository Versions (at time of audit)
| Repository | Package | Version | Notes |
|---|---|---|---|

### 1. Executive Summary & Audit Context
### 2. Previous Audit Verification
### 3. Folder Structure Analysis
### 4. File Length & Function Length Standards Analysis
### 5. OOP & Architectural Patterns Analysis
### 6. Potential Bugs & Issues
### 7. Code Duplication & Refactoring Opportunities
### 8. Exception Handling & Logging Audit
### 9. Modifications & Enhancements (Backend + Frontend)
### 10. Add-On Sub-Feature Suggestions
### 11. Codebase Health & Quality Scorecard
### 12. Prioritized Remediation Roadmap
### 13. Architecture Maturity Assessment
```

---

## 4. Health Scorecard Dimensions

Every audit MUST include a scorecard with these dimensions (scored out of 100):

| Dimension | What It Measures |
|---|---|
| **Type Safety & Contract Integrity** | `any`/`unknown` usage, type accuracy, contract coverage |
| **Security & Multi-Tenant Isolation** | IDOR, token exposure, authorization checks, static exposure |
| **Exception Handling & Observability** | Boundary-based error handling, structured logging, monitoring |
| **Database & Query Performance** | N+1 queries, indexes, streaming, pagination |
| **System Resilience & Concurrency** | Rate limiting, retry mechanisms, queue health |
| **Code Architecture & Modularity** | Service decomposition, layer separation, SRP compliance |
| **Code Organization & DRY** | Duplication ratio, hook/handler extraction, shared utilities |
| **OOP & Design Patterns** | DI consistency, pattern uniformity, composition usage |

---

## 5. Prioritized Remediation Roadmap

Every audit MUST produce a prioritized remediation roadmap:

| Priority | Category | Examples |
|---|---|---|
| 🔴 **P0** — Fix Immediately | Security & Data Integrity | IDOR vulnerabilities, token exposure, static directory exposure |
| 🟡 **P1** — Fix This Sprint | Quality & Robustness | Logging gaps, type normalization, error handling improvements |
| 🟠 **P2** — Refactoring Sprint | Architecture & DRY | Hook extraction, DRY patterns, service decomposition |
| 🟢 **P3** — Backlog | Optimization & Maintenance | File splitting, pattern unification, folder restructuring |

Each item MUST include: Finding ID, description, and estimated effort.

---

## 6. ESLint Enforcement

The audit MUST recommend ESLint rules to enforce standards programmatically. Recommend rules for both Backend and Frontend:

### 6.1 Backend ESLint Recommendations

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "max-lines": ["warn", { "max": 300, "skipBlankLines": true, "skipComments": true }],
    "max-lines-per-function": ["warn", { "max": 50, "skipBlankLines": true, "skipComments": true }],
    "max-params": ["warn", { "max": 6 }],
    "max-depth": ["warn", { "max": 4 }],
    "complexity": ["warn", { "max": 10 }],
    "no-console": ["error", { "allow": [] }],
    "no-restricted-syntax": [
      "error",
      {
        "selector": "TSTypeReference[typeName.name='unknown']",
        "message": "Use explicit TypeScript types, interfaces, or generics instead of unknown"
      },
      {
        "selector": "TSTypeReference[typeName.name='never']",
        "message": "The never type is forbidden unless used in exhaustive switch checks"
      },
      {
        "selector": "TSTypeLiteral:not(TypeAliasDeclaration TSTypeLiteral):not(InterfaceDeclaration TSTypeLiteral)",
        "message": "Inline object types are strictly forbidden. Define named interfaces in dedicated types files."
      },
      {
        "selector": "CatchClause[body.body.length=0]",
        "message": "Empty catch blocks are strictly forbidden. Log or rethrow errors."
      }
    ]
  }
}
```

### 6.2 Frontend ESLint Recommendations

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "max-lines": ["warn", { "max": 300, "skipBlankLines": true, "skipComments": true }],
    "max-lines-per-function": ["warn", { "max": 50, "skipBlankLines": true, "skipComments": true }],
    "max-params": ["warn", { "max": 6 }],
    "max-depth": ["warn", { "max": 4 }],
    "complexity": ["warn", { "max": 10 }],
    "no-console": ["error", { "allow": ["warn"] }],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "no-restricted-syntax": [
      "error",
      {
        "selector": "TSTypeReference[typeName.name='unknown']",
        "message": "Use explicit TypeScript types, interfaces, or generics instead of unknown"
      },
      {
        "selector": "TSTypeReference[typeName.name='never']",
        "message": "The never type is forbidden unless used in exhaustive switch checks"
      },
      {
        "selector": "TSTypeLiteral:not(TypeAliasDeclaration TSTypeLiteral):not(InterfaceDeclaration TSTypeLiteral)",
        "message": "Inline object types are strictly forbidden. Define named interfaces in dedicated types files."
      },
      {
        "selector": "CatchClause[body.body.length=0]",
        "message": "Empty catch blocks are strictly forbidden. Log or rethrow errors."
      }
    ]
  }
}
```

---

## 7. Anti-Patterns in Audit Reports

| ❌ Don't | ✅ Do Instead |
|---|---|
| Skip previous audit verification | Always verify every item from the prior version |
| Report only bugs, skip architecture analysis | Cover all 10 mandatory dimensions |
| List findings without file links or line numbers | Every finding MUST include clickable `file:///` links |
| Provide vague remediation ("refactor this") | Give specific extraction targets, method names, and file paths |
| Skip the scorecard | Always include the full health scorecard with scores |
| Report issues without priority classification | Always produce the P0–P3 remediation roadmap |
| Ignore frontend when auditing backend | Both layers MUST be audited in every report |
| Skip ESLint enforcement recommendations | Always include recommended ESLint config updates |
