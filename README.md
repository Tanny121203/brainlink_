# BrainLink Sample

BrainLink is a React + TypeScript app deployed on Netlify.  
This project now includes a production-oriented backend path:

- Netlify Functions API
- Neon Postgres
- Drizzle schema + migrations
- Cookie-based server-validated auth

## Quick start

1. Install dependencies:
   - `npm install`
2. Run frontend:
   - `npm run dev`

## Database scripts

- `npm run db:generate` - generate migration files from `db/schema.ts`
- `npm run db:migrate` - apply migrations to `DATABASE_URL`
- `npm run db:studio` - open Drizzle Studio

## Required environment variables

- `DATABASE_URL`
- `AUTH_JWT_SECRET`
- `CORS_ORIGIN`

## Important paths

- Netlify Functions: `netlify/functions`
- Schema: `db/schema.ts`
- SQL migration: `db/migrations/0001_initial.sql`
- API contract notes: `docs/backend-api-contracts.md`
- DB setup guide: `docs/database-setup.md`
