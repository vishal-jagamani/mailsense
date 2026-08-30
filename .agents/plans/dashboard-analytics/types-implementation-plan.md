# Dashboard & Analytics Types — Overview & Contract Changes

> **Target Version:** `@mailsense/types` `v1.4.0`
> **Status:** COMPLETED
> **Last Updated:** 2026-08-30

---

## 1. Overview

### Problem Statement

With the completion and deployment of the Email Experience features (v3.0.0), MailSense is moving to **Phase 2: Dashboard & Analytics**. The dashboard requires aggregated performance statistics, time-series email volume data, top sender leaderboards, response time metrics, and account summaries across connected mailboxes. Currently, `@mailsense/types` has an initial `AccountMetricsAttributes` interface but lacks dedicated domain enums, aggregation response DTOs, query filter parameter contracts, and response time distribution data structures. 

Without standardized shared type contracts adhering to the project's `*Attributes` naming convention for data entities, backend aggregation pipelines and frontend visualization charts risk type drift, runtime property mismatches, and `any`/`unknown` fallback violations.

### Goals

- Centralize all contract additions and modifications for the Dashboard & Analytics feature in `@mailsense/types`.
- Enforce strict, compiler-enforced interfaces for Overview KPIs, Email Volume Trends, Top Senders, Response Time Analytics, and Account Breakdowns using standard `*Attributes` entity conventions with zero `any`, `never`, or `unknown` types.
- Provide comprehensive timeframe presets including `TODAY` and `ALL_TIME` in the `ANALYTICS_TIMEFRAME` enum.
- Provide a single, consolidated manifest of target interfaces and enums organized by file, clearly annotating which implementation phase utilizes each type.
- Document proposed Semantic Versioning bump (`@mailsense/types@1.4.0`) and `CHANGELOG.md` entry within this plan file without modifying package source files during the planning stage.

---

## 2. Types to Add & Modify

### 2.1 Component: `src/analytics/analytics.enums.ts` (Phase 1)

#### [NEW] `ANALYTICS_TIMEFRAME` (Phase 1)

Timeframe filter presets for dashboard analytics queries including single-day, multi-day, month, year, all-time, and custom ranges.

```typescript
export enum ANALYTICS_TIMEFRAME {
    TODAY = 'today',
    SEVEN_DAYS = '7d',
    THIRTY_DAYS = '30d',
    NINETY_DAYS = '90d',
    THIS_MONTH = 'this_month',
    ONE_YEAR = '1y',
    ALL_TIME = 'all_time',
    CUSTOM = 'custom',
}
```

#### [NEW] `METRIC_TREND_DIRECTION` (Phase 1)

Direction indicator for KPI period-over-period trend comparisons.

```typescript
export enum METRIC_TREND_DIRECTION {
    UP = 'UP',
    DOWN = 'DOWN',
    NEUTRAL = 'NEUTRAL',
}
```

---

### 2.2 Component: `src/analytics/analytics.interfaces.ts` (Phases 1 & 2)

#### [NEW] `OverviewMetricsAttributes` (Phase 1)

High-level summary KPI metrics entity representing connected mailbox performance.

```typescript
export interface OverviewMetricsAttributes {
    totalEmails: number;
    unreadEmails: number;
    sentEmails: number;
    starredEmails: number;
    draftsCount: number;
    activeAccountsCount: number;
    totalThreadsCount: number;
    emailsChangePercentage?: number;
    unreadChangePercentage?: number;
    sentChangePercentage?: number;
}
```

#### [NEW] `EmailVolumeDataPointAttributes` (Phase 1)

Time-series email volume data point entity for volume charts (received vs sent counts per day/period).

```typescript
export interface EmailVolumeDataPointAttributes {
    date: string; // ISO date string format YYYY-MM-DD
    receivedCount: number;
    sentCount: number;
    totalCount: number;
}
```

#### [NEW] `TopSenderDataAttributes` (Phase 1)

Aggregation record entity for top contacts and email senders.

```typescript
export interface TopSenderDataAttributes {
    email: string;
    name: string;
    count: number;
    percentage: number;
    lastReceivedAt: string;
}
```

#### [NEW] `ResponseTimeDistributionAttributes` (Phase 1)

Histogram distribution entity for reply turnaround times.

```typescript
export interface ResponseTimeDistributionAttributes {
    under1Hour: number;
    between1And4Hours: number;
    between4And24Hours: number;
    over24Hours: number;
}
```

#### [NEW] `ResponseTimeMetricsAttributes` (Phase 1)

Aggregated response time calculations entity for conversation threads.

```typescript
export interface ResponseTimeMetricsAttributes {
    averageResponseMinutes: number;
    medianResponseMinutes: number;
    totalRepliesAnalyzed: number;
    responseRatePercentage: number;
    distribution: ResponseTimeDistributionAttributes;
}
```

#### [NEW] `AccountActivitySummaryAttributes` (Phase 1)

Per-account email and synchronization summary entity for dashboard grid cards.

```typescript
import { ACCOUNT_PROVIDER } from '../accounts/accounts.enums.js';

export interface AccountActivitySummaryAttributes {
    accountId: string;
    emailAddress: string;
    provider: ACCOUNT_PROVIDER;
    totalEmails: number;
    unreadEmails: number;
    sentEmails: number;
    lastSyncedAt?: number;
}
```

#### [NEW] `AnalyticsQueryParams` (Phase 1)

Query parameters for dashboard aggregation requests.

```typescript
import { ANALYTICS_TIMEFRAME } from './analytics.enums.js';

export interface AnalyticsQueryParams {
    accountId?: string;
    timeframe?: ANALYTICS_TIMEFRAME;
    startDate?: string;
    endDate?: string;
}
```

#### [NEW] `DashboardAnalyticsResponse` (Phase 1)

Root response envelope payload returned by `GET /api/analytics/dashboard`.

```typescript
import { ANALYTICS_TIMEFRAME } from './analytics.enums.js';

export interface DashboardAnalyticsResponse {
    overview: OverviewMetricsAttributes;
    volumeTrend: EmailVolumeDataPointAttributes[];
    topSenders: TopSenderDataAttributes[];
    responseTime: ResponseTimeMetricsAttributes;
    accountSummaries: AccountActivitySummaryAttributes[];
    timeframe: ANALYTICS_TIMEFRAME;
    startDate: string;
    endDate: string;
}
```

---

### 2.3 Component: `src/accounts/accounts.interfaces.ts` (Phase 1)

#### [MODIFY] `AccountMetricsAttributes` (Phase 1)

Extended historical account metrics snapshot entity in MongoDB.

```typescript
export interface AccountMetricsAttributes extends BaseEntity {
    accountId: string;
    totalEmails: number;
    totalThreads: number;
    totalLabels: number;
    totalFolders: number;
    totalContacts: number;
    unreadCount?: number; // Phase 1: Total unread emails tracked
    sentCount?: number; // Phase 1: Total sent emails tracked
    date: Date;
}
```

---

### 2.4 Component: Module Exports & Build Config (`src/analytics/index.ts`, `src/index.ts`, `package.json`, `tsup.config.ts`)

#### [NEW] [src/analytics/index.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense-types/src/analytics/index.ts) (Phase 1)

```typescript
export * from './analytics.enums.js';
export * from './analytics.interfaces.js';
```

#### [MODIFY] [src/index.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense-types/src/index.ts) (Phase 1)

```typescript
export * from './accounts/index.js';
export * from './analytics/index.js';
export * from './attachments/index.js';
export * from './common/index.js';
export * from './drafts/index.js';
export * from './emails/index.js';
export * from './events/index.js';
export * from './folders/index.js';
export * from './providers/index.js';
export * from './user/index.js';
export * from './workers/index.js';
```

#### [MODIFY] [package.json](file:///Users/vishaljagamani/Projects/Projects/mailsense-types/package.json) & [tsup.config.ts](file:///Users/vishaljagamani/Projects/Projects/mailsense-types/tsup.config.ts) (Phase 1)

- Proposed version bump to `1.4.0`.
- Register `./analytics` export subpath in `package.json`.
- Add `'src/analytics/index.ts'` entrypoint in `tsup.config.ts`.

---

## 3. Package Version & `CHANGELOG.md` Update

### Package Version

Target version update to be applied in `/Users/vishaljagamani/Projects/Projects/mailsense-types/package.json` upon release execution:

```json
"version": "1.4.0"
```

### `mailsense-types/CHANGELOG.md` Snippet

Target changelog block to be appended under `## [Unreleased]` in `/Users/vishaljagamani/Projects/Projects/mailsense-types/CHANGELOG.md` upon release execution:

```markdown
## [1.4.0] - 2026-08-30

### Added

- Added `analytics` module with `ANALYTICS_TIMEFRAME` (including `today` and `all_time`) and `METRIC_TREND_DIRECTION` enums.
- Added `OverviewMetricsAttributes`, `EmailVolumeDataPointAttributes`, `TopSenderDataAttributes`, `ResponseTimeDistributionAttributes`, `ResponseTimeMetricsAttributes`, and `AccountActivitySummaryAttributes` interfaces for dashboard reporting.
- Added `DashboardAnalyticsResponse` and `AnalyticsQueryParams` API request/response contracts for `GET /api/analytics/dashboard`.
- Added `unreadCount` and `sentCount` optional fields to `AccountMetricsAttributes`.
```

---

## 4. Build & Local Testing Steps

```bash
# 1. Build @mailsense/types package
cd /Users/vishaljagamani/Projects/Projects/mailsense-types && pnpm build

# 2. Sync build output to Frontend and Backend node_modules (if local symlink is restricted)
cp -r /Users/vishaljagamani/Projects/Projects/mailsense-types/dist/* /Users/vishaljagamani/Projects/Projects/mailsense/Frontend/node_modules/@mailsense/types/dist/
cp -r /Users/vishaljagamani/Projects/Projects/mailsense-types/dist/* /Users/vishaljagamani/Projects/Projects/mailsense/Backend/node_modules/@mailsense/types/dist/

# 3. Verify Backend TypeScript compilation
cd /Users/vishaljagamani/Projects/Projects/mailsense/Backend && pnpm build

# 4. Verify Frontend TypeScript compilation
cd /Users/vishaljagamani/Projects/Projects/mailsense/Frontend && npx tsc --noEmit
```
