# Supabase security model

The app uses Supabase Auth for identity, Postgres for authorization, and Row Level Security as the primary enforcement layer.

## Principles

- The browser only receives `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- The service role key is only used by local scripts or Cloudflare Pages Functions.
- All app tables have RLS enabled.
- Admin-only mutations are implemented as RPC functions that call `assert_admin()`.
- Customer-owned actions use `auth.uid()` inside SQL functions rather than trusting a customer ID from the frontend.
- Credits are append-only through `session_credit_ledger`.
- Audit logs are written through security-definer functions.
- Internal trainer notes live in `customer_private_notes`, an admin-only table.

## Customer isolation

Customers can read their own profile, workout plan, sessions, payments, metrics, credit ledger, bookings, and notifications. They cannot read other customers, financial analytics, internal notes, or credit mutations.

## Sensitive functions

Review these functions before production rollout:

- `request_booking`
- `accept_booking_request`
- `cancel_session`
- `complete_session`
- `mark_payment_completed`
- `adjust_customer_credits`
- `create_admin_announcement`

## Production hardening

Before production, run the checklist in `supabase/rls-test-checklist.sql`, configure Auth email templates, enforce strong passwords, and verify Cloudflare Pages secrets are not exposed in the built frontend.
