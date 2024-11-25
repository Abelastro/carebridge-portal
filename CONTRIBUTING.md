# Contributing

## Workflow

1. Create a branch from `main`.
2. Keep changes small and focused.
3. Run `npm run lint`, `npm run typecheck`, and `npm test` before opening a pull request.
4. Describe the user-facing change and any migration or configuration impact.

## Code conventions

- TypeScript is strict. Avoid `any` and unchecked casts at trust boundaries.
- Authorize every mutation on the server, even when the UI hides the control.
- Write an audit event for changes to patient, account, and access state.
- Never commit credentials, connection strings, or patient data.

## Database changes

Add a Prisma migration for every schema change and include the migration in the same pull
request as the code that depends on it.
