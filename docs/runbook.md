# Operations runbook

## Health checks

`GET /api/health` returns `200` when the application can reach PostgreSQL. A `503` means
the process is running but the database dependency is unavailable.

## Deploying

1. Build and publish the container image.
2. Run `prisma migrate deploy` as a one-off task.
3. Roll the application service.
4. Check the health endpoint and the error rate for five minutes.

## Rolling back

Deploy the previous image. Do not reverse a migration unless the release notes explicitly
say the schema change is backward compatible.

## Sign-in problems

Check the session cookie, the user's active flag, and the audit log for denied attempts.
