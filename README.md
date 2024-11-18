# CareBridge Portal

Internal operations console for care coordination teams.

The portal gives clinicians a single place to review patient records, capture encounter
notes, and keep administrative work out of the clinical workflow. It is intended for
deployment behind a private network with a managed PostgreSQL instance.

## Stack

- Next.js App Router
- TypeScript
- PostgreSQL with Prisma
- Tailwind CSS

## Local development

Copy `env.example` to `.env`, set the database connection string, then run the Prisma
migrations and seed script.

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

The development seed creates fictional users and patients. It must never be loaded into a
real environment.

## Status

This is an early internal build. Authentication, patient records, and the audit model are
under active development.
