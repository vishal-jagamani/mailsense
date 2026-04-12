# Frontend Changelog

All notable frontend changes for MailSense are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this frontend follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Added a new folders section with sidebar navigation, overview page, folder cards, and initial folder detail route wiring.
- Added frontend folder API hooks, request/response types, and route constants for folders flows.
- Added create-folder modal and folder card actions for rename and delete flows.
- Added folder-specific success/error messaging and query keys for folder mutations.

### Changed
- Updated the folders page to support search, account filtering, and paginated folder listing.
- Updated shared UI copy and navigation constants to include folders-related labels and routes.
- Adjusted shared breadcrumb and page header spacing to better fit the new folders experience.
- Updated folders data loading to use query-based fetching with automatic refresh after mutations.
- Updated folder cards to support inline rename state and mutation-driven actions.
- Added compact `xs` API loader size for lightweight in-place folder operations.

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

[Unreleased]: https://github.com/vishal-jagamani/mailsense/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.1.1
[1.1.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.1.0
[1.0.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.0.0
