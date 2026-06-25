# Cloudflare Pages + Supabase deployment

## Supabase

1. Create a Supabase project.
2. Copy the project URL and anon key.
3. Run `supabase/schema.sql`.
4. Run `supabase/functions.sql`.
5. Run `supabase/policies.sql`.
6. Run `supabase/storage.sql`.
7. Create the admin user in Supabase Auth or run `npm run create-demo-users` locally.
8. Run `supabase/seed.sql`.
9. Configure Auth redirect URLs for localhost, the Cloudflare Pages URL, and any custom domain.

## Cloudflare Pages

1. Push this repository to GitHub.
2. In Cloudflare, create a Pages project from the repository.
3. Use these build settings:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Add frontend-safe environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy.

## Optional admin invite function

The optional Pages Function `functions/api/admin/create-customer.ts` uses the Supabase service role key. Add it only as an encrypted Pages secret:

- `SUPABASE_SERVICE_ROLE_KEY`

Never expose this secret as a `VITE_` variable.

## Cloudflare DNS/custom domain

1. Add the domain to Cloudflare.
2. Add a Pages custom domain from the Pages project.
3. Let Cloudflare create the DNS record automatically or create the CNAME it provides.
4. Confirm SSL/TLS is active.
5. Test login and password reset from a phone.
