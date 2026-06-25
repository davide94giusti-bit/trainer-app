# Trainer App - Supabase + Cloudflare Pages

A production-oriented MVP starter for a personal trainer customer management app using:

- Cloudflare Pages
- Vite + React + TypeScript
- MUI
- React Router
- TanStack Query
- React Hook Form + Zod
- Supabase Auth
- Supabase Postgres
- Supabase RLS
- Supabase SQL RPC functions

This version intentionally does **not** use NestJS, Prisma, Docker, Oracle VM, custom sessions, custom invite tokens, or custom password reset tables.

## Project structure

```text
src/                 React app
functions/           Optional Cloudflare Pages Functions
supabase/            SQL schema, RLS, RPC, seed, storage setup
docs/                Deployment, security, and testing docs
scripts/             Local service-role scripts only
```

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set these in `.env`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## Supabase setup

In Supabase SQL editor, run:

```sql
-- 1
-- supabase/schema.sql
-- 2
-- supabase/functions.sql
-- 3
-- supabase/policies.sql
-- 4
-- supabase/storage.sql
-- 5
-- supabase/seed.sql
```

Then create an admin Auth user and link it to `profiles`, or run:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key npm run create-demo-users
```

Run `supabase/seed.sql` again after demo users are created.

## Cloudflare Pages deployment

Use these settings:

- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`

Set Cloudflare Pages environment variables:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Only add this as an encrypted Pages secret if using the optional admin create-customer function:

```bash
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

## Admin/demo user creation

Recommended MVP path:

1. Create `admin@example.com` in Supabase Auth.
2. Run `scripts/create-demo-users.ts` or manually insert the matching admin profile row.
3. Create or invite customers through Supabase Auth.
4. Insert matching `profiles` and `customer_profiles` rows.

The optional Pages Function can invite users through the Supabase Admin API after verifying the caller is an active admin.

## Implemented

- Supabase Auth login, logout, password reset, invite acceptance UI.
- Admin/customer route protection from profile role and status.
- MUI responsive layout with drawer and mobile bottom nav.
- Light/dark/system theme preference.
- English, Spanish, and Italian message dictionaries.
- Customer dashboard, sessions, workout plan, metrics, availability, payments, notifications, and settings.
- Admin dashboard, customers, exercises, workout plans, sessions, bookings, payments, packages, settings, notifications, and audit logs.
- Complete SQL schema with RLS enabled for every app table.
- RPC functions for booking, sessions, payments, credits, workout assignment, notifications, and availability.
- Seed data and RLS verification checklist.
- Optional Cloudflare Pages Function for secure admin invite/customer creation.

## Deferred

- Stripe checkout integration.
- Full shared-session matching UI and acceptance workflow.
- Email/push delivery providers beyond the notification delivery table.
- Rich exercise media upload UI.
- Automated end-to-end browser tests.
- Native App Store / Google Play packaging. The responsive web app is structured so an Expo/React Native client can later consume the same Supabase backend.

## Known limitations

- Hosted Supabase Auth users are not created by plain SQL. Use Supabase dashboard, the local service-role script, or the optional Pages Function.
- RLS must be tested in a real Supabase project with separate admin/customer JWTs.
- The frontend is an MVP admin/customer console, not a polished consumer-grade mobile app yet.

## Next recommended step

Create a Supabase project, run the SQL files, create demo users, deploy to Cloudflare Pages, and execute the RLS checklist before adding payment provider automation or native mobile packaging.
