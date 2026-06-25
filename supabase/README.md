# Supabase setup

Run the SQL files in this order from the Supabase SQL editor:

1. `schema.sql`
2. `functions.sql`
3. `policies.sql`
4. `storage.sql`
5. `seed.sql`

## Auth users

Hosted Supabase Auth users are not created reliably through plain SQL. Use one of these paths:

- Use the Supabase dashboard: Authentication -> Users -> Add user / Invite user.
- Use `npm run create-demo-users` locally with `SUPABASE_SERVICE_ROLE_KEY` set.
- Deploy the optional Cloudflare Pages Function at `functions/api/admin/create-customer.ts` and call it from an admin-only workflow.

After creating demo users, run `seed.sql` again so demo profiles, trainer profile, metrics, credits, and notifications attach to the Auth user UUIDs.

## Required redirect URLs

In Supabase Auth URL configuration, add:

- `http://localhost:5173/**`
- Your Cloudflare Pages URL, for example `https://trainer-app.pages.dev/**`
- Your custom domain, for example `https://app.example.com/**`
