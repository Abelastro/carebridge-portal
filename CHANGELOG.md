# Changelog

All notable changes to CareBridge Portal are recorded here. The project follows semantic
versioning for internal releases.

## [1.6.0] - 2026-06-03

### Added

- Amazon Bedrock Converse integration behind a provider interface.
- Summary validation for length, grounding, assistant-style disclaimers, and leaked
  identifiers.
- Prompt-injection inspection with severity levels and an audit entry when a note is
  blocked.

### Changed

- Development defaults to the deterministic mock provider.
- Summary generation records model identifier, duration, and source-note digest.

## [1.5.0] - 2026-03-11

### Added

- Patient search across name and record number, with status filtering.
- Encounter timeline on the patient detail page.
- Dashboard counters for active patients, pending review, encounters today, pending
  summaries, and audit events today.

### Changed

- Patient status updates now require the `patient:write` permission and write an audit
  event with the previous and next status.

## [1.4.0] - 2025-12-09

### Added

- Login rate limiting per client address.
- Session revocation on sign-out and a session list ready for a future device-management
  screen.
- Security headers and disabled framework identification in Next.js configuration.

### Fixed

- Redirect target after sign-in is validated to remain on the same origin.

## [1.3.0] - 2025-09-22

### Added

- User administration for role changes and account state.
- Role labels and permission helpers shared by pages and server actions.
- Initial Vitest setup for permission and hashing helpers.

### Changed

- Prisma indexes and relations reviewed for the access patterns used by the portal.

## [1.2.0] - 2025-06-17

### Added

- Encounter notes and the first summary form.
- Audit event model and write helper used by authentication flows.
- Empty states for patient search and dashboard lists.

### Changed

- Upgraded the application to the Next.js App Router and React Server Components.
- Moved data access into `src/lib/services` so pages remain mostly presentational.

## [1.1.0] - 2025-02-04

### Added

- Patient registry with a fictional seed dataset.
- Clinician dashboard with recent encounters.
- Password hashing and database-backed sessions.

### Changed

- Replaced the prototype file-backed store with PostgreSQL and Prisma.
- Added a CI workflow for lint, type check, tests, and build.

## [1.0.0] - 2024-11-26

### Added

- Initial internal release.
- Sign-in, session handling, and a read-only patient list.
- Base layout, styling tokens, and local development instructions.
