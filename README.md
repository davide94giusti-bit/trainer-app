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

Only server-side Cloudflare Pages Functions may use:

```bash
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
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

For existing deployed projects, also run:

```sql
-- supabase/migrations/20260625_admin_app_builder.sql
-- supabase/migrations/20260625_monthly_availability_shared_sessions.sql
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

Add this as an encrypted Pages secret for secure admin/customer creation:

```bash
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

## Admin/demo user creation

Recommended path:

1. Create the first admin manually in Supabase Auth or run `scripts/create-demo-users.ts`.
2. Ensure the matching `public.profiles` row has `role = admin` and `status = active`.
3. Log in as that admin.
4. Use `/admin/admins/new` to create additional admin login users.
5. Use `/admin/customers/new` to create customer login users and customer profiles.

The Pages Function at `/api/admin/create-user` creates or invites Supabase Auth users after verifying that the caller is an active admin.

## Implemented

- Supabase Auth login, logout, password reset, invite acceptance UI.
- Admin/customer route protection from profile role and status.
- MUI responsive layout with drawer and mobile bottom nav.
- Light/dark/system theme preference.
- English, Spanish, and Italian message dictionaries.
- Customer dashboard, sessions, workout plan, metrics, monthly availability calendar, payments, notifications, and settings.
- Admin dashboard, customers, exercises, workout plans, sessions, bookings, payments, packages, settings, notifications, and audit logs.
- Complete SQL schema with RLS enabled for every app table.
- RPC functions for booking, rescheduling, shared-session approval, sessions, payments, credits, workout assignment, notifications, and monthly availability.
- Seed data and RLS verification checklist.
- Secure Cloudflare Pages Function for admin/customer Auth user creation and invitations.
- Dedicated `/admin` back office with admin-only navigation.
- Admin user management and customer user/profile creation flows.
- App Builder for branding, customer dashboard widgets, content blocks, navigation, policies, languages, feature flags, and read-only preview.
- Full customer monthly availability calendar with session-type filters, full-page day detail dialog, booking requests, reschedule requests, and shared-session requests.
- Admin-configurable shared-session discount percentage through App Builder policies.
- Shared-session request workflow requiring both trainer approval and approval from the customer already booked in the session.
- i18n key coverage safeguard for English, Spanish, and Italian dictionaries.

## Deferred

- Stripe checkout integration.
- Email/push delivery providers beyond the notification delivery table.
- Rich exercise media upload UI.
- Automated end-to-end browser tests.
- Native App Store / Google Play packaging. The responsive web app is structured so an Expo/React Native client can later consume the same Supabase backend.

## Known limitations

- Hosted Supabase Auth users are not created by plain SQL. Use the Cloudflare Pages Function, Supabase dashboard, or the local service-role script for the first bootstrap admin.
- RLS must be tested in a real Supabase project with separate admin/customer JWTs.
- The monthly calendar depends on trainer availability rules and session focus metadata. If sessions do not have a `focus_area`, the calendar derives a filter label from linked exercise categories or workout plan title where available.
- The frontend is an MVP admin/customer console, not a polished consumer-grade mobile app yet.

## Next recommended step

Create a Supabase project, run the SQL files, create demo users, deploy to Cloudflare Pages, and execute the RLS checklist before adding payment provider automation or native mobile packaging.
