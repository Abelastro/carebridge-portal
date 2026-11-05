# Security policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately to the maintainers rather than opening a
public issue. Include the affected route or component, the conditions required to reproduce
the problem, and any evidence that helps us confirm impact.

We aim to acknowledge reports within three business days and to provide a remediation plan
within ten business days. Please allow time for a fix and coordinated disclosure before
publishing details.

## Scope

This repository contains application code for a fictional care coordination product. The
policy describes how the code is intended to be handled if someone adapts it, but there is no
production service attached to this repository and no bug bounty program.

## Security model

- Passwords are hashed with bcrypt at a cost factor of 12.
- Sessions are opaque random values. The database stores only a SHA-256 digest, and the
  browser receives the value in an HTTP-only, same-site cookie. Sessions expire after eight
  hours and can be revoked server-side.
- Authorization is enforced on the server for every page, server action, and route handler.
  Navigation visibility is a convenience and is never the only control.
- Login attempts are rate limited by client address. The in-memory limiter is appropriate
  for a single instance; a multi-instance deployment should use a shared store.
- Audit events are hash chained. Verification detects edits and deletions inside the
  retained window, but it cannot prevent a privileged database operator from rebuilding the
  chain. Ship events to append-only storage in any serious deployment.
- Model input is checked for prompt-injection patterns and identifiers are redacted before
  the request leaves the application. Model output is validated for length, grounding, and
  leaked identifiers before it is stored.
- Logs redact cookies, authorization headers, and credential-shaped fields.

## Handling sensitive data

The seed data is fictional. Do not load real patient information into a development or test
environment. A real deployment would require a risk assessment, a HIPAA business associate
agreement where applicable, encryption and key-management review, retention rules, access
reviews, backup testing, and monitoring for unusual access patterns.

## Dependencies

Dependency updates should be reviewed and tested like application changes. The CI workflow
runs type checking, linting, unit tests, and a production build. Enable the repository's
dependency alerts and review advisories for Next.js, Prisma, and the AWS SDK.

## Supported versions

Only the current `main` branch is maintained. There are no long-term support branches.
