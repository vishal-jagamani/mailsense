---
trigger: always_on
---

---

## trigger: always_on

# Shared Types Implementation Plan Standards (@mailsense/types)

> **Scope:** All implementation plans defining shared TypeScript contracts, DTOs, enums, and API interfaces for the `@mailsense/types` library.
> **Location:** All types plans MUST live inside feature folders under `mailsense/.agents/plans/<feature-name>/types-implementation-plan.md`.

---

## 1. Core Principles & Strict Rules

### 1.1 Strictly No `any`, `never`, or `unknown` Types

- **Never** use `any`, `never`, or `unknown` in shared interface definitions, function parameter types, or return types.
- Always use explicit primitive types, domain enums, generic type bindings (e.g. `Record<K, V>`), or dedicated nested interfaces.

### 1.2 No Inline Object Types

- Interface properties must reference reusable, named TypeScript interfaces or enums (e.g. `attachments: EmailAttachment[]`).
- Inline object type definitions are permitted **ONLY** if they contain a maximum of 1 or 2 primitive keys (e.g., `{ id: string; name: string }`).

### 1.3 Consolidated Type Definitions (No Phase Duplication)

- **Do NOT** duplicate interface declarations or type definitions across multiple phase headings.
- Consolidate all additions and modifications into single, full type definitions organized by domain module / target file under Section 2.
- Explicitly annotate each interface, type, or field with its target implementation phase(s) in its header or docstring comments (e.g., `#### [MODIFY] EmailAttributes (Phases 1 & 2)`).

### 1.4 Deferred Code Changes (Planning Phase Protocol)

- **Package Version & CHANGELOG.md**: The proposed version bump (e.g., `1.2.0`) and the proposed `CHANGELOG.md` entry MUST be documented **ONLY inside the implementation plan file** during the planning phase.
- **Do NOT** modify `package.json` or `CHANGELOG.md` in the actual `@mailsense/types` repository until the plan is approved and executed.

---

## 2. Mandatory Document Structure

````markdown
# <Feature Name> Types — Overview & Contract Changes

> **Target Version:** `@mailsense/types` `v<X.Y.Z>`
> **Status:** <DRAFT | APPROVED | IN PROGRESS | COMPLETED>
> **Last Updated:** <YYYY-MM-DD>

---

## 1. Overview

### Problem Statement

### Goals

## 2. Types to Add & Modify

### 2.1 Component: `src/<module>/<file>.ts`

#### [MODIFY / NEW] `<InterfaceName>` (`Phase <X>` or `Phases <X> & <Y>`)

```typescript
// Single consolidated interface / enum definition with phase annotations
```
````

## 3. Package Version & CHANGELOG.md Update

### Package Version

### `mailsense-types/CHANGELOG.md` Snippet

## 4. Build & Local Testing Steps

```bash
cd mailsense-types && pnpm build
cp -r /path/to/mailsense-types/dist/* /path/to/mailsense/Frontend/node_modules/@mailsense/types/dist/
cd Frontend && npx tsc --noEmit
```

```

---

## 3. Section Specifications

### 3.1 Overview

Provide concise context explaining why the contract changes are required.

- **Problem Statement:** Describe contract gaps, missing DTOs, or type safety risks.
- **Goals:** Summarize key interfaces, enums, and module additions.
- **Target Package Version:** Explicitly specify the proposed Semantic Versioning bump (e.g., `v1.2.0`).

### 3.2 Types to Add & Modify

Group code specifications by **Domain Module / Target File** (`src/emails/emails.interfaces.ts`, `src/drafts/drafts.interfaces.ts`, etc.) instead of duplicating interface blocks under phase headings.

- Annotate each interface or enum with the implementation phase(s) that utilize it in its section header (e.g., `(Phase 1)`, `(Phases 1 & 2)`).
- Provide **single, full TypeScript code blocks** for all new and modified interfaces/enums.
- Annotate fields clearly with docstring or inline comments indicating phase-specific additions.
- Explicitly state whether a file/type is modified (`[MODIFY]`) or created (`[NEW]`).

### 3.3 Package Version & CHANGELOG.md Update

Provide the exact configuration changes and markdown snippets to be applied upon release execution.

- **Package Version:** Show exact `"version": "<X.Y.Z>"` string.
- **CHANGELOG.md Snippet:** Format using standard [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) structure (`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`).

### 3.4 Build & Local Testing Steps

Enumerate standard build and downstream verification commands:

1. `cd /path/to/mailsense-types && pnpm build`
2. Sync/Copy output `dist` to `Frontend/node_modules/@mailsense/types/dist/` (if local symlinking is restricted).
3. `cd /path/to/mailsense/Backend && pnpm build`
4. `cd /path/to/mailsense/Frontend && npx tsc --noEmit`

---

## 4. Anti-Patterns to Avoid

| ❌ Don't                                                       | ✅ Do Instead                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------- |
| Use `any`, `never`, or `unknown` types in contract files       | Use explicit, compiler-enforced interfaces or enums                 |
| Define inline object signatures with > 2 properties            | Export a dedicated named interface                                  |
| Duplicate interface declarations across phase headings         | Provide a single consolidated type definition per interface with phase annotations in headers/comments |
| Update actual `package.json` or `CHANGELOG.md` during planning | Document proposed version and changelog block in the plan file only |
| Omit code blocks and summarize interfaces in prose             | Always provide full TypeScript interface code snippets              |
| Split types plans across subdirectories                        | Keep one self-contained plan file under `mailsense/.agents/plans/`  |
```
