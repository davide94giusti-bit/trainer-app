# Admin testing checklist

## Build and deploy

- `npm install` succeeds.
- `npm run build` succeeds.
- Cloudflare Pages deploys from GitHub.
- Supabase environment variables exist in Cloudflare Pages.

## Auth

- Admin can log in.
- Customer can log in.
- Password reset redirects to `/reset-password`.
- Invite redirects to `/accept-invite`.
- Deactivated customer cannot use the app.

## RLS checks

- Customer cannot read another customer profile.
- Customer cannot read another customer payment.
- Customer cannot insert credit ledger rows.
- Customer cannot call `mark_payment_completed`.
- Admin can read customer records.
- Admin can complete a payment.
- Customer can call `request_booking` for their own account.

## Business logic

- Completing a payment creates a positive credit ledger entry.
- Completing a session creates a negative credit ledger entry.
- Late cancellation follows `late_cancel_policy`.
- Booking acceptance creates a confirmed session and notification.
- Audit log rows are created by sensitive RPC functions.
