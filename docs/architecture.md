# Architecture

CareBridge Portal is a server-rendered Next.js application backed by PostgreSQL.

## Request flow

1. Middleware performs a cheap cookie-presence check for authenticated areas.
2. The page or server action calls `requireSession` and re-checks the permission matrix.
3. Reads go through `src/lib/services`; mutations also write an audit event.
4. The audit event is linked to the previous event hash inside a database transaction.

## Main modules

- `src/app` — pages, layouts, server actions, and route handlers
- `src/lib/auth` — password hashing, sessions, and role permissions
- `src/lib/audit` — hash chain and event queries
- `src/lib/llm` — prompt construction, guardrails, provider adapter, and summarization
- `src/lib/services` — database read models used by pages

## Open questions

- Whether to move summary generation to a queue for long notes.
- How to expose audit export without weakening the integrity model.
