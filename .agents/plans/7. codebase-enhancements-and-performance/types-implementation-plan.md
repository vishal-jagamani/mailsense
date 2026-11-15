# Platform Resilience & Codebase Enhancements Types — Overview & Contract Changes

> **Target Version:** `@mailsense/types` `v1.5.0`
> **Status:** COMPLETED
> **Created:** 2026-09-26 · **Last Updated:** 2026-09-26

---

## 1. Overview

### Problem Statement

The MailSense platform is undergoing a major resilience, security, and performance iteration (Sprint P4) following the v1.1.0 codebase health audit. Two key architectural enhancements require shared TypeScript contract specifications:
1. **AI Event Pipeline Foundation (`ARCH-NEXT-02`):** Background email synchronization processes ingestion batches in BullMQ workers, but currently only dispatches account-level metrics via `SYNC_COMPLETED`. Downstream intelligence features (Phase 4 AI Foundation: categorization, summarization, priority scoring) require an explicit, strongly typed `EMAIL_BATCH_SYNCED` event contract carrying the batch of ingested email IDs, account ID, and tenant user ID.
2. **Keyboard Navigation & Shortcut Actions (`UI-NEXT-02`):** Frontend power-user keyboard shortcut interactions require a centralized action enum and key-binding metadata type to ensure uniform shortcut dispatch, avoid hardcoded key strings, and allow customizable shortcuts across inbox views.

### Goals

- Define `SYSTEM_EVENT.EMAIL_BATCH_SYNCED` and the strongly typed `EmailBatchSyncedPayload` contract in the events domain.
- Register `EmailBatchSyncedPayload` in `SystemEventPayloads` to enforce compile-time payload safety across the event bus.
- Define keyboard navigation action enums (`KEYBOARD_SHORTCUT_ACTION`) and shortcut definition interfaces for frontend accessibility and power-user tooling.
- Prepare a clean, backwards-compatible release bump to `@mailsense/types` `v1.5.0`.

---

## 2. Types to Add & Modify

### 2.1 Component: `src/events/events.enums.ts`

#### [MODIFY] `SYSTEM_EVENT` (Phase 1)

```typescript
// System event names dispatched across event bus
export enum SYSTEM_EVENT {
    SYNC_COMPLETED = 'sync:completed',
    EMAIL_CREATED = 'email:created',
    EMAIL_BATCH_SYNCED = 'email:batch:synced', // Phase 1 (ARCH-NEXT-02)
}
```

---

### 2.2 Component: `src/events/events.interfaces.ts`

#### [NEW] `EmailBatchSyncedPayload` (Phase 1)
#### [MODIFY] `SystemEventPayloads` (Phase 1)

```typescript
import { EmailAttributes } from '../emails/emails.interfaces.js';
import { SYSTEM_EVENT } from './events.enums.js';

// Payload for SYNC_COMPLETED system event
export interface SyncCompletedPayload {
    accountId: string;
    addedEmailsCount: number;
    deletedEmailsCount: number;
    startedAt: number;
    completedAt: number;
}

// Payload for EMAIL_CREATED system event
export interface EmailCreatedPayload {
    accountId: string;
    email: Partial<EmailAttributes>;
}

// Payload for EMAIL_BATCH_SYNCED system event — Phase 1 (ARCH-NEXT-02)
export interface EmailBatchSyncedPayload {
    accountId: string;
    userId: string;
    emailIds: string[];
    batchSize: number;
    timestamp: number;
}

// Registry interface mapping system events to their payload types
export interface SystemEventPayloads {
    [SYSTEM_EVENT.SYNC_COMPLETED]: SyncCompletedPayload;
    [SYSTEM_EVENT.EMAIL_CREATED]: EmailCreatedPayload;
    [SYSTEM_EVENT.EMAIL_BATCH_SYNCED]: EmailBatchSyncedPayload; // Phase 1 (ARCH-NEXT-02)
}
```

---

### 2.3 Component: `src/common/common.enums.ts`

#### [MODIFY] Add `KEYBOARD_SHORTCUT_ACTION` (Phase 4)

```typescript
// Centralized keyboard navigation action identifiers for inbox operations — Phase 4 (UI-NEXT-02)
export enum KEYBOARD_SHORTCUT_ACTION {
    NEXT_EMAIL = 'NEXT_EMAIL',
    PREVIOUS_EMAIL = 'PREVIOUS_EMAIL',
    OPEN_EMAIL = 'OPEN_EMAIL',
    BACK_TO_LIST = 'BACK_TO_LIST',
    STAR_EMAIL = 'STAR_EMAIL',
    MARK_UNREAD = 'MARK_UNREAD',
    ARCHIVE_EMAIL = 'ARCHIVE_EMAIL',
    DELETE_EMAIL = 'DELETE_EMAIL',
    COMPOSE_EMAIL = 'COMPOSE_EMAIL',
    FOCUS_SEARCH = 'FOCUS_SEARCH',
    SHOW_SHORTCUTS = 'SHOW_SHORTCUTS',
}
```

---

### 2.4 Component: `src/common/common.interfaces.ts`

#### [NEW] `KeyboardShortcutDefinition` & `KeyboardShortcutGroup` (Phase 4)

```typescript
import { KEYBOARD_SHORTCUT_ACTION } from './common.enums.js';

// Metadata definition for a single keyboard shortcut — Phase 4 (UI-NEXT-02)
export interface KeyboardShortcutDefinition {
    id: KEYBOARD_SHORTCUT_ACTION;
    key: string;
    description: string;
    category: 'navigation' | 'actions' | 'composer' | 'general';
    shiftKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
}

// Grouped category container for shortcuts display modal — Phase 4 (UI-NEXT-02)
export interface KeyboardShortcutGroup {
    title: string;
    shortcuts: KeyboardShortcutDefinition[];
}
```

---

## 3. Package Version & CHANGELOG.md Update

### Package Version

```json
{
    "name": "@mailsense/types",
    "version": "1.5.0"
}
```

### `mailsense-types/CHANGELOG.md` Snippet

```markdown
## [1.5.0] - 2026-09-26

### Added
- **Events:** Added `SYSTEM_EVENT.EMAIL_BATCH_SYNCED` enum member and `EmailBatchSyncedPayload` interface for post-sync AI event pipeline integration (`ARCH-NEXT-02`).
- **Events:** Bound `[SYSTEM_EVENT.EMAIL_BATCH_SYNCED]` inside `SystemEventPayloads` registry contract.
- **Common:** Added `KEYBOARD_SHORTCUT_ACTION` enum representing standardized email navigation and action commands (`UI-NEXT-02`).
- **Common:** Added `KeyboardShortcutDefinition` and `KeyboardShortcutGroup` interfaces for type-safe keyboard shortcut binding and modal rendering.
```

---

## 4. Build & Local Testing Steps

```bash
# 1. Build @mailsense/types
cd /Users/vishaljagamani/Projects/Projects/mailsense-types
pnpm build

# 2. Sync built dist to Backend and Frontend node_modules
cp -r /Users/vishaljagamani/Projects/Projects/mailsense-types/dist/* /Users/vishaljagamani/Projects/Projects/mailsense/Backend/node_modules/@mailsense/types/dist/
cp -r /Users/vishaljagamani/Projects/Projects/mailsense-types/dist/* /Users/vishaljagamani/Projects/Projects/mailsense/Frontend/node_modules/@mailsense/types/dist/

# 3. Verify TypeScript compilation across downstream packages
cd /Users/vishaljagamani/Projects/Projects/mailsense/Backend
pnpm build

cd /Users/vishaljagamani/Projects/Projects/mailsense/Frontend
npx tsc --noEmit
```
