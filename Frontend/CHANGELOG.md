# Frontend Changelog

All notable frontend changes for MailSense are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this frontend follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added `recharts` (`^3.10.1`) and `@types/recharts` (`^2.0.1`) chart visualization dependencies to `package.json`.
- Added `ANALYTICS_API_ENDPOINTS.DASHBOARD` to centralized endpoint definitions in `Frontend/src/shared/api/endpoints.ts`.
- Added `ANALYTICS_QUERY_KEYS` in `Frontend/src/shared/api/query-keys.ts` with factory methods for dashboard queries and filter-based cache keys.
- Added `DASHBOARD: '/'` to `HOME_ROUTES` in `Frontend/src/shared/constants/routes.ts`.
- Added `Frontend/src/shared/constants/dashboard.ts` centralizing timeframe options (`today`, `7d`, `30d`, `90d`, `this_month`, `1y`, `all_time`), stale time (60s), and volume chart color palettes.
- Added `Frontend/src/features/analytics/types/index.ts` defining `UseDashboardPageResult`, `TimeframeOption`, `UseDashboardParams`, `CustomDateRangeState`, and `ChartSeriesConfig`.
- Added `fetchDashboardAnalytics` API client wrapper in `Frontend/src/features/analytics/api/analytics.api.ts` mapping `/analytics/dashboard`.
- Added `useGetDashboardAnalyticsQuery` React Query hook in `Frontend/src/features/analytics/api/analytics.queries.ts` with 60s stale time and window focus refetching.
- Added `useDashboardPage` custom hook in `Frontend/src/features/analytics/hooks/useDashboardPage.ts` managing filter state, connected account resolution, custom date boundaries, and breadcrumb synchronization.
- Added `DashboardHeader` with mobile/desktop responsive filter layout, account selection dropdown, and timeframe filter pills.
- Added `OverviewKpiCards` displaying 6 productivity metric cards with trend indicators.
- Added `EmailVolumeChart` dual-area chart using Recharts for Received vs Sent email volume.
- Added `AccountDistributionPieChart` doughnut chart showing per-mailbox volume share with a centered total emails count and aligned legend.
- Added `ResponseTimeCard` showing turnaround speed metrics and 4-tier distribution bars.
- Added `TopSendersCard` contact leaderboard with avatars, counts, and volume share progress bars.
- Added `AccountActivityGrid` cards summarizing per-account sync health and direct inbox navigation.
- Added `DashboardSkeleton` loading placeholders and `DashboardEmptyState` mailbox connect CTA.
- Added `DashboardPage` primary view in `Frontend/src/features/analytics/pages/index.tsx` and mounted on `/` (`Frontend/src/app/(home)/page.tsx`).
- Added `Dashboard` navigation item with `LayoutDashboard` Lucide icon to sidebar (`Frontend/src/shared/constants/sidebar.constants.ts`).

## [3.0.0] - 2026-08-29

### Added
- Added `DraftsPage` (`Frontend/src/features/drafts/pages/index.tsx`) and App Router route (`Frontend/src/app/(home)/drafts/page.tsx`).
- Added `DraftListTable` component suite (`DraftListTableHeader.tsx`, `DraftListTableBody.tsx`, `DraftListHeader.tsx`).
- Added `useAutoSaveDraft` custom hook with 3000ms debouncing for auto-saving drafts during compose typing.
- Added `useDraftsPage` custom hook supporting search filtering by recipient/subject/snippet, pagination, multi-select, and bulk/single deletion.
- Added `DraftApi` client wrapper in `Frontend/src/features/drafts/api/draft.api.ts` mapping `/drafts` endpoints.
- Added React Query query hooks (`useGetUserDraftsQuery`, `useGetDraftByIdQuery`) and mutation hooks (`useSaveDraftMutation`, `useDeleteDraftMutation`, `useSendDraftMutation`) in `draft.queries.ts` and `draft.mutations.ts`.
- Added `activeDraftId` state and `openWithDraft(draftId)` action to `useComposeEmailPopupStore.ts`.
- Added auto-save status feedback (saving indicator, last saved timestamp) and discard draft handling in `useComposeEmail.ts`, `ComposeEmail` index, and `ComposeEmailFooter.tsx`.
- Added "Drafts" navigation item to sidebar (`sidebar.constants.ts`, `routes.ts`).
- Added `MoveToFolderDropdown` component for moving single or bulk selected emails to destination folders.
- Added real-time folder search inside the Move to Folder dropdown modal.
- Added single-account folder filtering to restrict destination folder options to the target account's folder structure.
- Added multi-account selection safeguards with Radix `Tooltip` guidance disabling cross-account moves.
- Added `useMoveEmailsMutation` React Query hook with automatic `[EMAILS]` and `[FOLDERS]` cache invalidation.
- Added staged attachment file upload trigger via paperclip icon button in Compose email footer (`ComposeEmailFooter.tsx`).
- Added staged attachment chips display with formatted file sizes (KB/MB) and deletion (`X`) buttons in Compose email modal (`index.tsx`).
- Added attachment download support in email details and threaded conversation view.
- Added image attachment preview support directly from email detail attachments.
- Added thread-view rendering in email details for conversations with multiple messages.
- Added thread count badges in email list rows to show how many messages belong to a conversation.
- Added attachment indicator badges in email list rows.

### Changed
- Updated `useComposeEmail` hook to upload file selections to `POST /api/attachments/upload`, manage `stagedAttachments` state, and attach `attachmentIds` to compose email submissions.
- Updated email detail data loading to fetch thread data alongside single-email details.
- Updated email detail and thread rendering to show attachment lists for messages that include files.
- Updated frontend email feature wiring to use the new thread endpoint and shared email-recipient formatting helper.
- Updated frontend workspace and dependency metadata for the current shared package and lockfile setup.

## [2.1.0] - 2026-07-31

### Added
- Added an Account settings tab with global background sync controls and connected-account sync status overview.
- Added account-level sync settings modal controls from connected account cards for mailbox-specific auto-sync and sync frequency updates.

### Changed
- Unified inbox now shows active background sync state and refreshes email results automatically while syncing is in progress.
- Connected account cards now surface failed sync warnings, never-synced state, and live sync progress more clearly.

### Fixed
- Fixed email list refresh after delete actions from inbox and folder mail views.
- Fixed profile settings form rendering when phone number metadata is missing.

## [2.0.0] - 2026-07-27

### Added
- Added frontend workspace support for the shared `@mailsense/types` package.

### Changed
- Migrated frontend account, email, folder, filter, and settings contracts to the shared `@mailsense/types` package and removed duplicated local type definitions.
- Updated frontend build and package configuration to transpile and locally link the shared `@mailsense/types` package.
- Updated account, inbox, folders, compose, and settings flows to consume shared backend-aligned contract types.

### Fixed
- Improved frontend/backend contract consistency across connected accounts, inbox, folders, compose, and settings data flows.

## [1.4.1] - 2026-06-29

### Added
- Added backend-driven inbox filter options for connected accounts, folders, date range, and unread status.
- Added shared inbox header component for search, filter, and bulk-action controls.

### Changed
- Updated unified inbox and account inbox pages to use shared filter option data from the backend instead of building filter lists locally.
- Updated the filter modal to support folder selection and unread toggle filters.
- Refactored inbox filtering flow to use dedicated email-filter query keys and endpoint wiring.

### Fixed
- Improved filter behavior consistency between unified inbox and account inbox views by using the same header and filter model.

## [1.4.0] - 2026-06-29

### Added
- Added frontend `entities` and `features` layers for accounts, auth, email, and user domain models.
- Added shared API barrel exports for Axios clients, endpoint constants, and query keys under `Frontend/src/shared/api/*`.
- Added reusable `AccountProviderIcon` support across connected accounts, compose account selection, inbox filters, folder filters, and page-header provider menus.
- Added a dedicated account info card component with updated connector messaging and onboarding copy.
- Added feature-based email, inbox, folders, and settings entry points under `Frontend/src/features/*`.
- Added a reusable, centralized `FilterModal` component to unify filter operations (by account and date range) across the folders overview and email inbox lists.
- Added a modular domain-driven folder model structure (`@entities/folder`) for type definitions and component state management.
- Added responsive desktop (`FolderBody.web.tsx`) and mobile (`FolderBody.mobile.tsx`) view files for the folders list.
- Added custom hooks (`useFoldersPage`, `useFolderBody`, and `useFolderEmailListPage`) to separate business/data logic from page and modal layout components.
- Added dedicated compose-email subcomponents and hooks for header, footer, recipient search, and send-flow state management.
- Added dedicated settings profile subcomponents and hooks for profile editing and password-change modal flows.

### Changed
- Refactored accounts and auth screens to load from the new feature-based page structure.
- Refactored inbox, account inbox, email details, compose email, folders, folder email list, and settings screens to load from the new feature-based page structure.
- Moved accounts API calls, account mutations, and account queries into `Frontend/src/features/accounts/api/*`.
- Moved auth API calls and queries into `Frontend/src/features/auth/api/*`.
- Moved email APIs, email queries/mutations, and compose-email UI into `Frontend/src/features/emails/*`.
- Moved inbox APIs, inbox queries/mutations, filters, tables, and page wrappers into `Frontend/src/features/inbox/*`.
- Moved folder APIs, folder queries/mutations, list/detail pages, and folder-management UI into `Frontend/src/features/folders/*`.
- Moved settings APIs, queries/mutations, and profile/password/account-deletion UI into `Frontend/src/features/settings/*`.
- Updated shared type usage so account, email, and user models are imported from entity layers instead of the old shared type files.
- Consolidated frontend API access through `Frontend/src/shared/api/client.ts`, `Frontend/src/shared/api/endpoints.ts`, and `Frontend/src/shared/api/query-keys.ts`.
- Consolidated email, folder, account, auth, and settings API endpoint constants under `Frontend/src/shared/api/endpoints.ts`.
- Updated shared email constants to consume `DATE_RANGE` from the email entity layer.
- Updated connected accounts grouping to render provider sections from the new feature-layer grouping hook.
- Updated connected accounts data loading so disabled accounts remain visible in account-management screens for re-enable flows.
- Updated account messaging to indicate Outlook availability and guide users to connect providers from the page header.
- Centralized core application state providers by moving them from `src/app/providers.tsx` to `src/shared/providers/index.tsx`.
- Refactored inbox, account inbox, and folder email list pages to integrate the new unified `FilterModal`.
- Replaced custom inbox and email search return interfaces with a generic `PaginatedDataResponse<T>` interface for cleaner query structures.
- Upgraded package dependencies, including `@auth0/nextjs-auth0`, `@tanstack/react-query`, `zustand`, `axios`, `motion`, and various Radix UI primitives.
- Refactored compose email into smaller feature components by moving rich-text editor, dialog sections, and recipient suggestion logic into focused files.
- Refactored settings profile flows into a page-level wrapper, reusable profile form, dedicated password modal, and shared `useProfileSettings` hook.
- Refactored inbox and email action menus to pull mutation/state logic into dedicated feature hooks.
- Consolidated runtime API/auth constants into `Frontend/src/shared/api/endpoints.ts` and removed deprecated shared URL/crypto constant files.
- Consolidated shared formatter and crypto utility usage by removing feature-local formatter copies and stale constants exports.

### Fixed
- Fixed account toggle state handling so failed enable/disable requests revert the local switch state instead of leaving the UI out of sync.
- Fixed provider icon rendering consistency by replacing repeated inline icon-mapping logic with a shared account provider icon component.
- Preserved existing compose, inbox action, folder action, and settings profile behavior while reducing duplicated component logic.

### Removed
- Removed the deprecated `src/modules` directory entirely, completing the migration of frontend logic to `entities`, `features`, and `shared/api` layers.
- Removed duplicate filter components (`FoldersFilter.tsx` and `EmailListFilter.tsx`).
- Removed deprecated type definitions from `src/shared/types/folder.types.ts`.

## [1.3.2] - 2026-05-31

### Added
- Added centralized sidebar constants and shared sidebar types for navigation structure.
- Added a compact Compose trigger with tooltip support for the collapsed sidebar state.

### Changed
- Updated sidebar account navigation to build inbox sub-items from connected accounts using shared sidebar configuration.
- Updated primary sidebar items so expandable sections keep a direct page link while using a separate toggle control for sub-navigation.
- Added route constants for starred mailbox navigation in shared frontend routing helpers.
- Moved settings API endpoint constants into a dedicated settings constants module.

### Fixed
- Improved collapsed-sidebar usability by keeping the Compose action accessible in icon-only mode.
- Fixed expandable sidebar navigation interactions so opening sub-items no longer replaces the parent item click target.

## [1.3.1] - 2026-05-21

### Added
- Added shared barrel exports for frontend hooks, stores, and types to simplify module access across the app.

### Changed
- Standardized frontend imports around centralized `@shared/*`, `@modules/*`, and `@lib/*` aliases across account, inbox, folders, compose, settings, and shared UI modules.
- Moved auth and theme Zustand stores under `Frontend/src/shared/store/*` and consolidated settings types under shared type exports.
- Updated component alias configuration so shared UI primitives resolve through `@shared/ui`.

### Fixed
- Newly connected accounts now align correctly with the account activation UI because connected accounts are created as active by default.

## [1.3.0] - 2026-05-19

### Added
- Added account enable and disable toggle controls in connected account cards.
- Added a sidebar-triggered compose email popup with account selection, recipients, subject, and rich-text message editing.
- Added frontend compose email API hook, request type, and success/error messaging.
- Added shared compose popup store and scroll-area/editor UI support for the compose experience.
- Added recipient search popup and suggestion badges for compose email.

### Changed
- Updated frontend account and inbox data requests to rely on authenticated backend session context instead of sending user IDs in API calls.
- Updated frontend API token retrieval to match the client-side Auth0 integration used by protected backend routes.
- Updated account management UI to support account activation state and refresh account data after toggle actions.
- Updated home layout to mount the compose popup globally within authenticated app screens.
- Updated sidebar UI to expose a primary Compose action.
- Updated compose popup to support multi-recipient chips, debounced contact search, and selection from provider-backed suggestions.

### Fixed
- Improved authenticated account loading reliability by aligning frontend requests with backend JWT-protected endpoints.
- Improved connected account visibility so disabled accounts no longer appear in active account-driven mailbox flows.
- Improved rich-text editor rendering and popup layout behavior for the compose workflow.

## [1.2.0] - 2026-04-13

### Added
- Added a new folders section with sidebar navigation, overview page, folder cards, and initial folder detail route wiring.
- Added frontend folder API hooks, request/response types, and route constants for folders flows.
- Added create-folder modal and folder card actions for rename and delete flows.
- Added folder-specific success/error messaging and query keys for folder mutations.
- Added folder email view so users can open a folder and browse emails within it.

### Changed
- Updated the folders page to support search, account filtering, and paginated folder listing.
- Updated shared UI copy and navigation constants to include folders-related labels and routes.
- Adjusted shared breadcrumb and page header spacing to better fit the new folders experience.
- Updated folders data loading to use query-based fetching with automatic refresh after mutations.
- Updated folder cards to support inline rename state and mutation-driven actions.
- Added compact `xs` API loader size for lightweight in-place folder operations.
- Updated folder email view to reuse inbox search, filters, selection actions, and pagination patterns.

### Fixed
- Improved sidebar navigation population so connected account links are shown for both inbox and folders sections.
- Improved folder detail breadcrumb setup so folder routes show the correct navigation context.

## [1.1.1] - 2026-03-09

### Added
- Added a shared `useIsMobile` hook for viewport-aware behavior across core UI modules.

### Changed
- Improved mobile responsiveness across inbox, account inbox, email details, accounts, settings, page header, breadcrumbs, and pagination components.
- Updated inbox mobile layout to better organize search, filters, and bulk actions.
- Updated email list table rendering for mobile with consolidated details and optimized date/action column sizing.
- Updated account and settings layouts for better small-screen spacing and width behavior.
- Frontend dev server script now binds to `0.0.0.0` for easier device/LAN testing during development.

### Fixed
- Reduced small-screen overflow/clipping issues in inbox and email details layouts by adjusting container heights, paddings, and control sizing.

## [1.1.0] - 2026-03-05

### Changed
- Re-enabled provider/account rendering from live account data in provider list, removing temporary client-side filtering that hid Outlook accounts in `ProviderAccountList`.
- Simplified provider grouping logic in account list by using per-provider filtered results directly, reducing duplicated state management.
- Removed temporary UI guard in header dropdown that blocked Outlook option rendering in `PageHeader`.
- Updated inbox action toolbar components to accept lifecycle callbacks:
  - `onRefetchEmails`
  - `onResetSelection`
  - `onResetPage`
- Updated both global inbox and account inbox pages to pass selection/page reset and refetch callbacks to action toolbars.
- Refactored action success handling to reset selected emails, reset pagination to page 1, and refresh email list after successful mutations.
- Removed inline mutation toast handling from inbox action menu for a cleaner post-action state flow.

### Fixed
- Removed hardcoded Outlook-hiding conditions in account selection UI components so connector visibility follows provider/account data.
- Fixed stale selection and pagination state after bulk actions (star/unread/delete).
- Fixed inconsistent refresh behavior between inbox and account-inbox action toolbars.

## [1.0.0] - 2026-02-22

### Added
- Initial frontend release with authenticated app shell and protected routes.
- Inbox experience:
  - Unified inbox page with list/table layout
  - Account-specific inbox page
  - Email details view
  - Search, filters, and pagination flows
- Email actions for connected accounts:
  - Delete/trash
  - Archive
  - Star/unstar
  - Mark unread/read
- Accounts management screens:
  - Provider list and connected accounts view
  - Account connection entry points
  - Account-level actions and status handling
- Settings experience for profile and password management.
- Shared frontend foundations:
  - React Query data layer and query-key patterns
  - Zustand auth state store
  - Auth0-integrated session/auth flow
  - Reusable UI components for loaders, headers, table/pagination, and toasts

### Changed
- Navigation and page routing standardized around App Router pages for inbox, accounts, settings, and email details.
- API integration patterns unified through shared Axios clients and module-level service hooks.

### Notes
- v1.0 UI was released with Gmail-first connector availability.

[Unreleased]: https://github.com/vishal-jagamani/mailsense/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v2.1.0
[2.0.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v2.0.0
[1.4.1]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.4.1
[1.4.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.4.0
[1.3.2]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.3.2
[1.3.1]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.3.1
[1.3.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.3.0
[1.2.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.2.0
[1.1.1]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.1.1
[1.1.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.1.0
[1.0.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.0.0
