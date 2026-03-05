# Frontend Changelog

All notable frontend changes for MailSense are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this frontend follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/vishal-jagamani/mailsense/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.1.0
[1.0.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.0.0
