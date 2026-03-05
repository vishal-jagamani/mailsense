# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[Unreleased]: https://github.com/vishal-jagamani/mailsense/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.1.0
[1.0.0]: https://github.com/vishal-jagamani/mailsense/releases/tag/v1.0.0
