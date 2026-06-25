-- Manual RLS verification checklist.
-- Run these from separate authenticated sessions or use Supabase SQL editor with request.jwt.claim.sub set.

-- 1. Customer cannot read another customer profile.
-- select * from profiles where id = '<OTHER_CUSTOMER_UUID>';

-- 2. Customer cannot read another customer payment.
-- select * from payments where customer_user_id = '<OTHER_CUSTOMER_UUID>';

-- 3. Customer cannot insert credit ledger.
-- insert into session_credit_ledger(customer_user_id, quantity, reason) values (auth.uid(), 10, 'admin_adjustment');

-- 4. Admin can read customers.
-- select * from profiles where role = 'customer';

-- 5. Admin RPC can complete payment.
-- select mark_payment_completed('<PAYMENT_UUID>');

-- 6. Customer RPC can request booking.
-- select request_booking(now() + interval '3 days', now() + interval '3 days 1 hour', 'test');

-- 7. Customer cannot call admin RPC.
-- select mark_payment_completed('<PAYMENT_UUID>'); -- should fail with Admin role required.
