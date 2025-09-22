# Changelog

All notable changes to CareBridge Portal are recorded here. The project follows semantic
versioning for internal releases.

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
