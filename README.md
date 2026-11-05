# CareBridge Portal

Clinician operations console for community care-coordination teams. CareBridge gives
clinical staff a single place to review their patient panel, document encounters, request
AI-assisted visit summaries, and keep an auditable record of every change.

The application is a Next.js App Router project backed by PostgreSQL through Prisma. It is
designed for small care organizations that need a pragmatic internal tool without a large
platform team.

## Features

- **Role-based access control** for administrators, clinicians, and auditors.
- **Patient registry** with search, status filters, primary-clinician assignment, and an
  encounter timeline.
- **Encounter summaries** generated through Amazon Bedrock, with a deterministic local
  provider for development and tests.
- **Guardrails** on both model input and model output: prompt-injection detection, PII
  redaction, grounding checks, and a maximum summary length.
- **Hash-chained audit log** for authentication events, patient changes, role changes, and
  summary generation. The admin audit screen verifies the chain before rendering it.
- **Session security** with HTTP-only cookies, hashed session values, expiry, revocation,
  and login rate limiting.
- **Operational endpoints** for health checks and structured JSON logs.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15.5 (App Router, Server Actions, Route Handlers) |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript 5.9 (strict) |
| Data | PostgreSQL 15+, Prisma 6 |
| Auth | Database-backed sessions, bcrypt password hashing |
| AI | Amazon Bedrock Converse API, mock provider for local use |
| Validation | Zod |
| Logging | Pino |
| Tests | Vitest |
| CI | GitHub Actions |

## Repository layout

```text
src/app                 App Router pages, layouts, and route handlers
src/components          Shared UI components
src/lib/audit           Hash chain and audit event helpers
src/lib/auth            Password, session, and permission helpers
src/lib/llm             Prompt, guardrails, provider, and summary workflow
src/lib/services        Read/write queries used by pages and actions
prisma                  Schema, migrations, and seed data
docs                    Architecture notes, runbook, and ADRs
tests                   Unit tests for pure security and domain logic
```

## Local setup

Requirements: Node.js 20.11 or newer, npm 10 or newer, and a PostgreSQL 15+ database.

```bash
npm install
cp env.example .env
# edit .env with your local database URL and a random 32+ character secret
npx prisma migrate dev
npm run db:seed
npm run dev
```

The application starts at `http://localhost:3000`.

`npm run db:seed` creates five fictional staff accounts and a small patient panel. The
seed passphrase comes from `SEED_PASSWORD`; when that variable is absent the script uses a
local development value. Seeded accounts are for local exploration only and must never be
used in a deployed environment.

### Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `AUTH_SECRET` | yes | 32+ character value used to sign local cookies |
| `APP_URL` | yes | Public origin, for example `http://localhost:3000` |
| `AWS_REGION` | yes | Region for Bedrock and S3 clients |
| `BEDROCK_MODEL_ID` | when using Bedrock | Model or inference profile identifier |
| `LLM_PROVIDER` | no | `mock` (default) or `bedrock` |
| `S3_BUCKET` | no | Bucket reserved for future document attachments |
| `LOG_LEVEL` | no | Pino level, defaults to `info` |
| `SEED_PASSWORD` | seed only | Passphrase applied to seeded accounts |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Generate Prisma Client and build for production |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler without emitting |
| `npm test` | Run the Vitest suite once |
| `npm run db:migrate` | Create and apply a development migration |
| `npm run db:deploy` | Apply committed migrations in a deployed environment |
| `npm run db:seed` | Load the fictional development dataset |

## How the pieces fit

### Authentication and authorization

Sign-in validates credentials with bcrypt, applies a fixed-window rate limit per client
address, and creates a server-side session. Only a SHA-256 digest of the opaque session
value is stored. Requests resolve the session from an HTTP-only, same-site cookie and
re-check that the account is still active.

Permissions are declared in `src/lib/auth/rbac.ts`. Pages and server actions call
`requirePermission`, while navigation only renders links the current role can use. The
model is intentionally small: administrators manage staff, clinicians work with their
panel, and auditors have read-only access plus the audit log.

### Encounter summaries

`src/lib/llm/summarize.ts` coordinates the workflow:

1. Inspect the note for prompt-injection signals.
2. Redact identifiers before the note leaves the application.
3. Call the configured provider.
4. Validate that the response is concise, grounded in the source, and free of identifiers.
5. Store the summary and write an audit event with model, latency, and note digest.

The local mock provider is extractive rather than generative, which keeps development
deterministic and avoids network access in tests.

### Audit integrity

Every audit event includes the hash of the preceding event. The hash covers the actor,
action, resource, outcome, request metadata, timestamp, and previous hash, serialized with
stable key ordering. `/admin/audit` walks the most recent events and reports the first
break if the chain no longer verifies. This is tamper-evident, not tamper-proof: a database
administrator can still rewrite the whole chain, so production deployments should also
ship events to append-only storage.

### Logging and health

The logger redacts cookies, authorization headers, and common credential fields. The health
endpoint performs a `SELECT 1` against PostgreSQL and returns a small JSON document with
the service version and latency. It is suitable for a load-balancer target group check.

## Testing

```bash
npm test
npm run typecheck
npm run lint
```

Unit tests cover the permission matrix, audit hashing and chain verification, rate-limit
windows, and the guardrail rules. The tests do not require a database.

## Deployment notes

A typical deployment runs the Next.js server in a container behind an application load
balancer, with PostgreSQL in RDS and secrets in AWS Secrets Manager. The included CI
workflow builds and tests every push. Database migrations are applied as a separate release
step with `npm run db:deploy` before the new task definition receives traffic.

The application does not include infrastructure as code. Teams deploying it should provide
their own container build, networking, secret management, backup policy, and log shipping.

## Documentation

- [Architecture](docs/architecture.md)
- [Operations runbook](docs/runbook.md)
- [ADR 0001: App Router and server actions](docs/adr/0001-nextjs-app-router.md)
- [ADR 0002: Hash-chained audit events](docs/adr/0002-hash-chained-audit-log.md)
- [ADR 0003: LLM guardrails and provider boundary](docs/adr/0003-llm-guardrails.md)

## Security

Please report vulnerabilities according to [SECURITY.md](SECURITY.md). Do not open a public
issue for a suspected security problem.

