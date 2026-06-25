# Admin console, secure user creation, and App Builder iteration

## Scope

This iteration separates the operational admin console from the customer-facing app and adds a CMS-style App Builder for customer-facing configuration.

## Frontend route model

- Admin routes live under `/admin` and render through `src/layouts/AdminShell.tsx`.
- Customer routes render through `src/layouts/CustomerShell.tsx`.
- Active admins are redirected to `/admin` and do not see customer navigation by default.
- Active customers cannot access `/admin` or `/admin/*`.

## Secure user creation

Admins create admins and customers from:

- `/admin/admins/new`
- `/admin/customers/new`

Both flows call:

```txt
POST /api/admin/create-user
```

The Cloudflare Pages Function:

1. Reads `SUPABASE_SERVICE_ROLE_KEY` only from the server-side Cloudflare environment.
2. Requires a bearer token from the logged-in frontend session.
3. Verifies the Supabase user token.
4. Loads the caller profile from `public.profiles`.
5. Requires `role = 'admin'` and `status = 'active'`.
6. Creates, invites, or reuses a Supabase Auth user.
7. Upserts `public.profiles`.
8. Upserts `public.customer_profiles` or `public.trainer_profiles`.
9. Optionally adds starting credits through `public.session_credit_ledger`.
10. Writes `public.audit_logs`.

Frontend code must only use:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

The frontend must never use:

```txt
SUPABASE_SERVICE_ROLE_KEY
```

## App Builder

Admin routes:

```txt
/admin/app-builder
/admin/app-builder/branding
/admin/app-builder/dashboard
/admin/app-builder/content
/admin/app-builder/navigation
/admin/app-builder/policies
/admin/app-builder/languages
/admin/app-builder/features
/admin/app-builder/preview
```

Database tables:

```txt
app_branding_settings
app_content_blocks
app_dashboard_widgets
app_navigation_items
app_feature_flags
app_policy_settings
```

All new tables have RLS enabled. Active admins can read/write settings. Active customers can only read enabled customer-facing settings where applicable. Customer navigation items are blocked from pointing at `/admin` routes.

## Internationalization

Supported languages are mandatory:

```txt
en
es
it
```

Message files:

```txt
src/messages/en.json
src/messages/es.json
src/messages/it.json
```

Safeguard:

```bash
npm run check:i18n
```

The production build runs the i18n key check before TypeScript and Vite build steps.

## Supabase migration

Run this migration on an existing deployed project:

```txt
supabase/migrations/20260625_admin_app_builder.sql
```

For a fresh project, run the standard files in order:

```txt
supabase/schema.sql
supabase/functions.sql
supabase/policies.sql
supabase/storage.sql
supabase/seed.sql
```

## Cloudflare Pages environment variables

Set these in Cloudflare Pages:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` must be configured as an encrypted Pages secret.
