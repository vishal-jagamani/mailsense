# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Added account enable and disable controls in the connected accounts experience.
- Added compose email support with a new in-app compose popup for sending messages from connected accounts.

### Changed
- Updated authenticated app requests so account, user, folder, and email data now resolve from the signed-in session instead of passing user IDs in request payloads.
- Inactive accounts are now excluded from account lists, sync flows, inbox results, and folder views until re-enabled.
- Updated inbox defaults to keep sent, spam, and trash messages out of the main email list across connected providers.

### Fixed
- Improved reliability of authenticated account and inbox data loading by aligning frontend requests with backend JWT-based authorization.
- Improved account management flow by preventing disabled accounts from being synced or shown in active mailbox views.
- Improved backend error responses for provider API failures during email actions.

## [1.2.0] - 2026-04-13

### Added
- Added a new folders area in the app with sidebar navigation and a dedicated folders overview page.
- Added folder management actions for creating, renaming, and deleting folders from the folders workspace.
- Added the ability to open a folder and browse the emails inside that folder.

### Changed
- Folder browsing now supports search, account filtering, and paginated listing.
- Folder data now refreshes automatically after folder create, rename, and delete actions.
- Account sync now also refreshes folder data so folder lists stay aligned with connected mail providers.

### Fixed
- Improved sticky header and breadcrumb spacing for smoother page layout on the new folders flow.

## [1.1.1] - 2026-03-09

### Added
- Improved mobile responsiveness across key screens, including inbox, account inbox, email details, accounts, and settings.

### Changed
- Inbox list, filter/action bar, and pagination behaviors were updated for better mobile usability.
- Email list responses now include plain-text preview content to improve message snippet rendering in list views.

## [1.1.0] - 2026-03-05

### Outlook connector support for account syncing and email details retrieval.

### Added
- Outlook support for bulk email actions: delete, archive, mark unread/read, and flag/unflag.

### Changed
- Inbox action flows now consistently refresh email data and reset selection/page state after successful bulk actions.

## [1.0.0] - 2026-02-22

### Added
- Initial v1.0 release with Gmail connector support.

### Notes
- Outlook connector is in development and not included in this release.

[Unreleased]: https://github.com/vishal-jagamani/mailsense/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.2.0
[1.1.1]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.1.1
[1.1.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.1.0
[1.0.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.0.0
