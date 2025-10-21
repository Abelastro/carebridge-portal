# Operations runbook

This runbook covers the local and deployed operation of CareBridge Portal. The repository is
a training fixture; the procedures describe the intended production posture if the code is
adapted.

## Service checks

- Health endpoint: `GET /api/health`
- Expected healthy body: `status` is `ok`, `database` is `ok`, and a latency in milliseconds.
- A 503 with `status: degraded` means the process is up but PostgreSQL did not answer the
  `SELECT 1` probe.
- Application logs are newline-delimited JSON. Each line includes `service`, `level`, and a
  message. Request errors include an error type but not patient note contents.

## Local environment

1. Start PostgreSQL and create an empty database.
2. Copy `env.example` to `.env` and set the database URL and a random application value.
3. Run `npm install`, `npx prisma migrate dev`, and `npm run db:seed`.
4. Start with `npm run dev`.
5. Sign in with a seeded account. The seed script prints the account list but not the
   passphrase.

If Prisma reports that the schema is out of date, run `npx prisma migrate dev` again. If the
generated client is stale after switching branches, run `npm run db:generate`.

## Deploying a release

1. Confirm CI is green on the release commit.
2. Build and publish the container image.
3. Run `npm run db:deploy` as a one-off task against the target database.
4. Register a new task definition and roll the service.
5. Watch the health endpoint and error-rate dashboard for ten minutes.
6. Verify sign-in and one read-only patient page.

Migrations should be backward compatible for one release. Add columns as nullable, deploy
code that tolerates both shapes, then tighten constraints in a later release.

## Rolling back

Application rollback is a task-definition rollback. Database rollback is not automatic.
Before a migration that drops or rewrites data, take a snapshot and document the reversal
steps. If a release is unhealthy, roll back the task definition first, then decide whether
the migration needs a forward fix.

## Sign-in problems

- Confirm the account is active in the user administration screen.
- Check the audit log for `auth.login` with outcome `DENIED` or
  `auth.login.rate_limited`.
- Rate limits are fixed windows in process memory. Restarting the service clears them; a
  multi-instance deployment should replace the limiter with a shared store.
- Session failures after a deploy usually mean the cookie was issued by an older host or the
  session row was revoked. Clear the site cookie and sign in again.

## Summary generation problems

- Confirm `LLM_PROVIDER` is set as intended. The default is `mock`; production must opt in to
  `bedrock`.
- Check that the task role can invoke the configured model in `AWS_REGION`.
- A 422 means a guardrail rejected the note or the model response. The response includes a
  reason such as `prompt_injection` or `summary_validation`; the audit event records the
  outcome without storing the note.
- A 502 means the provider call failed. Check Bedrock throttling, model availability, and
  network egress. The audit event includes the model identifier and duration.

## Audit integrity

The admin audit page verifies the most recent 500 events and shows the first broken index.
If a break appears:

1. Export the current audit window before making changes.
2. Compare the previous hash at the break with the stored hash of the preceding event.
3. Check for manual database edits, partial restores, or a restore that merged rows from
   different points in time.
4. Treat the gap as a security incident until explained. Do not "repair" hashes in place;
   preserve evidence and append a new event describing the investigation.

## Credential and secret rotation

- Application cookie secret: rotate during a maintenance window. Existing sessions remain
  valid because the current implementation stores session digests rather than signing them,
  but the value should still be treated as sensitive configuration.
- Database credentials: create a new user or rotate the password in Secrets Manager, update
  the task definition, and roll the service. Remove the old credential after the rollback
  window.
- AWS task role: prefer short-lived credentials. Never put access keys in environment files.

## Backups and retention

Enable automated RDS backups and test a restore quarterly. Audit events should be exported
to append-only storage with a retention period that matches the organization's policy.
Patient records and encounter notes require a documented retention and deletion process;
the application does not implement legal holds or purge workflows.

## Incident checklist

- Declare the severity and an incident owner.
- Preserve logs, audit exports, and relevant database snapshots.
- Limit blast radius by disabling the affected account or revoking sessions.
- Communicate with clinical leadership if patient data may have been exposed.
- Record the timeline and decisions in the incident document.
- Follow the organization's breach-notification obligations.
