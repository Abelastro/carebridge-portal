# Contributing

Thanks for taking a look at CareBridge. This repository is a training fixture, so changes
are primarily useful as examples. If you adapt it for your own work, the guidance below
keeps the codebase consistent.

## Development workflow

1. Create a branch from `main`.
2. Make a focused change with tests where the behavior is testable without a database.
3. Run `npm run typecheck`, `npm test`, and `npm run lint`.
4. Open a pull request describing the problem, the approach, and any operational impact.

Use conventional, descriptive commit subjects. Keep formatting-only changes separate from
behavioral changes.

## Code conventions

- TypeScript is strict. Avoid `any`; prefer narrow types and Zod parsing at boundaries.
- Server-only modules import `server-only` where appropriate and must not be pulled into
  client components.
- Authorization belongs on the server. Do not rely on hidden navigation for access control.
- Every mutation that changes clinical or account state should write an audit event.
- New model calls must go through `src/lib/llm/summarize.ts` so guardrails and audit logging
  remain in one place.
- Keep patient-facing copy plain and avoid exposing internal identifiers in summaries.

## Database changes

Create a migration with `npx prisma migrate dev --name <description>` and commit both the
schema change and the generated SQL. Do not edit an applied migration. Include a short note
in the pull request about backfill or rollout requirements.

## Tests

Tests live in `tests/` and run with Vitest. Pure logic such as permissions, hashing,
rate-limit windows, and guardrails should be covered without a database. If a change needs
an integration test, describe the setup in the pull request so CI can be extended
deliberately.

## Security

Do not commit credentials, connection strings, patient data, or generated secrets. Use the
documented environment variables and local fixtures. Report vulnerabilities through the
process in [SECURITY.md](SECURITY.md).
