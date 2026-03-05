# Backend Changelog

All notable backend changes for MailSense are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this backend follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-03-05

### Added
- Outlook account sync support using Microsoft Graph delta sync, including initial sync and incremental sync via stored delta cursor.
- Outlook delta-change handling to process newly added emails and remove deleted emails from local storage.
- Outlook message details fetch support (`getMessageDetails`) for full single-email retrieval from provider API.
- Outlook bulk email action support in backend service layer:
  - Delete to trash / permanent delete
  - Archive / unarchive
  - Mark unread / read
  - Flag / unflag
- Outlook Graph API helpers for message move, permanent delete, read-state updates, and flag-state updates.
- Outlook folder enum/constants for provider move operations.
- Backend developer scripts: `build:clean`, `lint:fix`, `format`, `format:check`, and `type-check`.

### Changed
- Account sync flow refactored: provider sync now runs through shared `startAccountSync` and shared sync cursor update logic.
- Outlook message ingestion now supports paginated delta retrieval and persists `@odata.deltaLink` as sync cursor.
- Email detail service behavior updated: for Outlook emails, details are fetched live from Outlook API instead of only using stored compressed body fields.
- Outlook email mapping updated to include `to`, `cc`, and `bcc` recipients more explicitly.
- Bulk upsert email repository now accepts `Partial<EmailInput>` to support provider-specific payload completeness.
- Bulk email action orchestration in `EmailService` now executes Outlook provider operations when account provider is Outlook.
- Backend dependency and tooling versions updated (including lint/type-related and core HTTP/monitoring packages).

### Fixed
- Sync metadata update (`lastSyncedAt`, `lastSyncCursor`) centralized to reduce provider-specific duplication and keep sync state updates consistent.
- Outlook incremental sync now removes emails locally when provider marks them as removed in delta response.
- Incorrect logger context labels fixed in bulk email handlers (`deleteEmail`, `archiveEmails`, `starEmails`, `unreadEmails`).
- Local DB state now stays synchronized after Outlook actions (folder/read/flag updates and provider message ID updates when move operations return a new ID).

## [1.0.0] - 2026-02-22

### Added
- Initial backend release with production-ready Gmail connector support for OAuth account linking and token handling.
- Accounts APIs for provider listing, account list/details, connect/callback flow, account deletion, and manual sync triggers.
- Email APIs for unified list, account-specific list, details, search, delete, archive, star, and unread operations.
- Gmail sync pipeline to fetch provider messages/history and persist email data in MongoDB.
- User APIs for profile fetch/update and Auth0-powered password change.
- Core backend foundations:
  - Express app + route wiring under `/api`
  - MongoDB connection + typed config/env validation
  - Request validation middleware and centralized error handling
  - Logging and API request utility layer

### Changed
- Email retrieval and list operations standardized around shared projections, filters, and pagination behavior.
- Account sync model established with sync cursor and last-synced metadata to support repeat sync cycles.
- Provider abstraction introduced so Gmail and Outlook integrations can share service patterns over time.

### Notes
- Outlook connector remained in-progress in this release and was not intended for full user rollout.

[Unreleased]: https://github.com/vishal-jagamani/mailsense/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.1.0
[1.0.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.0.0
