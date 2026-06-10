# Nyumbani Hub

A modern property-listing and rental marketplace built with React + TypeScript (Vite), an Express TypeScript API, and Supabase (Postgres + Storage). The project provides user registration and verification, agent/landlord listings, tenant applications, payments integration, and file uploads.

**Tech stack**: React 19, Vite, TypeScript, Express (server.ts), Supabase (Postgres + Storage), Stripe (optional), Nodemailer (SMTP), Tailwind CSS, shadcn components.

**Repository layout**
- **`src/`**: Frontend source (components, pages, services).
- **`server.ts`**: Express backend and API routes.
- **`src/lib/supabase.ts`**: Supabase clients (anon + service-role).
- **`schema.sql`**: Database schema and migrations for Supabase.
- **`migrations/`**: SQL migrations (created by this project).
- **`components/`**: UI primitives (shadcn-based components).

**Quick links**
- File: [server.ts](server.ts)
- Client Supabase helper: [src/lib/supabase.ts](src/lib/supabase.ts)
- Frontend API wrapper: [src/services/api.ts](src/services/api.ts)
- Auth UI: [src/components/AuthModal.tsx](src/components/AuthModal.tsx)
- Tenant dashboard: [src/components/TenantDashboard.tsx](src/components/TenantDashboard.tsx)
- Agent dashboard: [src/components/AgentDashboard.tsx](src/components/AgentDashboard.tsx)

**Requirements**
- Node.js 18+ (this repo used Node.js 24 in development) and npm
- A Supabase project (URL, anon key, and service-role key)
- SMTP credentials for email sending (or configure a development stub)

**Local setup**
1. Clone the repository and change into the project folder.
2. Install dependencies:
	```bash
	npm install
	```
3. Create a `.env` file (copy `.env.example` if available) and set the required variables (example keys used for development — replace with your own):
	- `SUPABASE_URL` — your Supabase project URL
	- `SUPABASE_ANON_KEY` — Supabase anon/public key
	- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role key (server only, keep secret)
	- `JWT_SECRET` — a secret for signing JWTs
	- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` — SMTP settings
	- `SUPABASE_STORAGE_BUCKET` — bucket name for uploads (default: `uploads`)

4. Run the dev server (runs server.ts with `tsx` and loads `.env`):
	```bash
	npm run dev
	```
	- The server listens on the port configured in `server.ts` (default 3000). The frontend runs through Vite when developing locally.

**Database**
- The schema for Supabase is in `schema.sql`. Use the Supabase SQL editor or psql to apply migrations. A helper migration is in `migrations/`.
- Important user columns: `verificationtoken`, `verificationexpiresat`, `emailverified`, `phonenumber`, `country`, `sessionversion`.

**How data is stored**
- Users, properties, applications, messages, payments, and broadcasts are persisted in Supabase Postgres tables (`users`, `properties`, `applications`, `messages`, `payments`, `broadcasts`).
- File uploads are stored in Supabase Storage (or previously stored to `public/uploads/` before migration). The server uploads files to the bucket and returns a public URL.
- JWTs are issued by the backend and include `sessionVersion`. Logging out increments `sessionversion` to invalidate existing tokens.

**Email verification flow**
- On signup the server generates a 6-digit code and stores it in the user's row (`verificationtoken` + `verificationexpiresat`). The server uses SMTP (configured in `.env`) to send the code; the client provides a UI to enter the code and call `/api/auth/verify-email`.

**API endpoints (selection)**
- `POST /api/auth/signup` — create account (sends verification email)
- `POST /api/auth/login` — authenticate, returns JWT
- `GET /api/auth/verify-email` — verify account by token/code
- `POST /api/auth/resend-verification` — request new verification code
- `POST /api/auth/logout` — invalidate all sessions (increments `sessionversion`)
- `GET /api/properties` — list properties
- `POST /api/properties` — create property (authenticated & verified agent/landlord)
- `POST /api/upload` — upload a file (returns public URL)

**Deployment guidance**
- Frontend: deploy to Vercel (Vite site)
  - set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel environment variables.
- Backend: host on Render, Railway, or another Node host. Provide the service-role key and SMTP credentials as environment variables. Ensure `PORT` is honored by `server.ts`.
- If you want serverless on Vercel, convert Express routes to Vercel API functions and handle uploads via direct client-to-Supabase signed URLs.

**Security notes**
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in the client or commit it to the repository. Use server-side env variables only.
- Use `--force-with-lease` when pushing only if you understand the implications for remote history.

**Troubleshooting**
- `supabaseUrl is required` on server start: ensure `SUPABASE_URL` (or `VITE_SUPABASE_URL`) and `SUPABASE_ANON_KEY` are defined in `.env` and that `dotenv` is loaded when running `server.ts` (the dev script preloads dotenv).
- PostgREST schema cache errors (PGRST204): add missing columns to the `users` table and restart the Supabase project or PostgREST so the schema cache refreshes (the repo includes `migrations/2026-06-10-add-users-columns.sql`).

**Developer notes**
- Frontend stores token and user in `localStorage` (`token`, `user`). The API wrapper is `src/services/api.ts`.
- Supabase client helpers are in `src/lib/supabase.ts`. Server code uses the service-role client for privileged actions.

**Contributing**
- Make feature branches from `main` and open PRs. Keep secrets out of commits. Run `npm run lint` (TypeScript check) before opening PRs.

**License & Attribution**
- This repository does not include a license by default. Add a LICENSE file if you want to make it open source.

If you want, I can also:
- Prepare a `Dockerfile` and `docker-compose.yml` for local development with Supabase emulation.
- Convert the backend to Vercel Serverless API routes and prepare the Vercel project config.
- Add CI checks for TypeScript and linting.

---
Last updated: 2026-06-10
