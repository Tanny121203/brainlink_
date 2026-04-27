# Database Setup (Neon + Netlify Functions + Drizzle)

## 1) Environment variables

Set these in Netlify site settings and local `.env`:

- `DATABASE_URL` - Neon Postgres connection string
- `AUTH_JWT_SECRET` - strong random secret for JWT signing
- `CORS_ORIGIN` - frontend origin allowed by API CORS (e.g. `https://your-site.netlify.app`)

## 2) Create schema

Migration files are in `db/migrations`.

Use:

- `npm run db:generate` (when schema changes)
- `npm run db:migrate` (apply migrations)
- `npm run db:studio` (optional schema inspection)

## 3) Deploy

- `netlify.toml` is configured with `netlify/functions` as Functions directory.
- Frontend calls Functions via `/.netlify/functions/*`.

## 4) Migration strategy from localStorage

1. Auth is now server-backed via cookie (`auth-register`, `auth-login`, `auth-me`, `auth-logout`).
2. Existing local state modules can be migrated one by one to API endpoints:
   - sessions
   - availability
   - reschedule requests
   - inbox threads
3. Keep localStorage fallback during transition to avoid blocking user flows.

