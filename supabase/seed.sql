-- Seed data. Safe to run repeatedly.
-- Auth users are not created by this SQL. Create users in Supabase Auth first or run scripts/create-demo-users.ts.

insert into public.app_settings(key, value)
values
  ('cancellation_window_hours', '24'::jsonb),
  ('late_cancel_policy', '"consume_credit"'::jsonb),
  ('booking_without_credits', 'false'::jsonb),
  ('default_language', '"en"'::jsonb),
  ('default_theme', '"system"'::jsonb),
  ('bank_details', '{"iban":"CH00 0000 0000 0000 0000 0","beneficiary":"Trainer","reference":"Use your full name"}'::jsonb)
on conflict (key) do update set value = excluded.value;

insert into public.packages(name, description, credit_quantity, price, currency)
values
  ('{"en":"Starter 4 sessions","es":"Inicial 4 sesiones","it":"Starter 4 sessioni"}', '{"en":"Four private sessions"}', 4, 260, 'EUR'),
  ('{"en":"Standard 8 sessions","es":"Estándar 8 sesiones","it":"Standard 8 sessioni"}', '{"en":"Eight private sessions"}', 8, 480, 'EUR'),
  ('{"en":"Performance 12 sessions","es":"Rendimiento 12 sesiones","it":"Performance 12 sessioni"}', '{"en":"Twelve private sessions"}', 12, 660, 'EUR')
on conflict do nothing;

insert into public.exercises(name, description, category, muscles, equipment, difficulty, instructions, common_mistakes, safety_notes)
values
  ('{"en":"Goblet squat","es":"Sentadilla goblet","it":"Goblet squat"}', '{"en":"Squat holding one dumbbell or kettlebell."}', 'Lower body', array['quadriceps','glutes'], array['dumbbell'], 'beginner', '{"en":"Keep chest tall and knees tracking over toes."}', '{}', '{}'),
  ('{"en":"Romanian deadlift","es":"Peso muerto rumano","it":"Stacco rumeno"}', '{"en":"Hip hinge for posterior chain."}', 'Lower body', array['hamstrings','glutes'], array['barbell','dumbbells'], 'intermediate', '{"en":"Push hips back and keep a neutral spine."}', '{}', '{}'),
  ('{"en":"Push-up","es":"Flexión","it":"Piegamento"}', '{"en":"Bodyweight horizontal press."}', 'Upper body', array['chest','triceps'], array['bodyweight'], 'beginner', '{"en":"Brace core and lower under control."}', '{}', '{}'),
  ('{"en":"Seated row","es":"Remo sentado","it":"Rematore seduto"}', '{"en":"Horizontal pulling movement."}', 'Upper body', array['back','biceps'], array['cable'], 'beginner', '{}', '{}', '{}'),
  ('{"en":"Plank","es":"Plancha","it":"Plank"}', '{"en":"Core anti-extension hold."}', 'Core', array['core'], array['bodyweight'], 'beginner', '{}', '{}', '{}'),
  ('{"en":"Lunge","es":"Zancada","it":"Affondo"}', '{"en":"Single-leg strength drill."}', 'Lower body', array['glutes','quadriceps'], array['bodyweight','dumbbells'], 'beginner', '{}', '{}', '{}'),
  ('{"en":"Lat pulldown","es":"Jalón al pecho","it":"Lat machine"}', '{"en":"Vertical pulling movement."}', 'Upper body', array['lats','biceps'], array['machine'], 'beginner', '{}', '{}', '{}'),
  ('{"en":"Hip thrust","es":"Hip thrust","it":"Hip thrust"}', '{"en":"Glute-dominant hip extension."}', 'Lower body', array['glutes'], array['barbell'], 'intermediate', '{}', '{}', '{}'),
  ('{"en":"Dumbbell shoulder press","es":"Press hombro mancuerna","it":"Shoulder press manubri"}', '{"en":"Vertical press with dumbbells."}', 'Upper body', array['shoulders','triceps'], array['dumbbells'], 'intermediate', '{}', '{}', '{}'),
  ('{"en":"Dead bug","es":"Dead bug","it":"Dead bug"}', '{"en":"Core control drill."}', 'Core', array['core'], array['bodyweight'], 'beginner', '{}', '{}', '{}')
on conflict do nothing;

-- Link app profiles if matching Auth users already exist.
insert into public.profiles(id, role, status, full_name, email, language, theme)
select id, 'admin', 'active', coalesce(raw_user_meta_data->>'full_name', 'Demo Admin'), email, 'en', 'system'
from auth.users where email = 'admin@example.com'
on conflict (id) do update set role = 'admin', status = 'active';

insert into public.trainer_profiles(user_id, business_name, default_session_minutes)
select id, 'Eddy Personal Training', 60 from public.profiles where email = 'admin@example.com'
on conflict (user_id) do nothing;

insert into public.profiles(id, role, status, full_name, email, language, theme)
select id, 'customer', 'active', coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), email, 'en', 'system'
from auth.users where email in ('customer1@example.com','customer2@example.com','customer3@example.com')
on conflict (id) do update set role = 'customer', status = 'active';

insert into public.customer_profiles(user_id, objective, height_cm, target_weight_kg)
select id, 'Improve strength and body composition', 175, 78 from public.profiles where email in ('customer1@example.com','customer2@example.com','customer3@example.com')
on conflict (user_id) do nothing;

insert into public.availability_rules(trainer_user_id, day_of_week, start_time, end_time, slot_minutes)
select id, dow, time '08:00', time '18:00', 60
from public.profiles p cross join generate_series(1,5) dow
where p.email = 'admin@example.com'
on conflict do nothing;

-- Demo plans/payments/credits are inserted only when demo users exist.
with c as (select id from public.profiles where email = 'customer1@example.com' limit 1),
     a as (select id from public.profiles where email = 'admin@example.com' limit 1)
insert into public.workout_plans(customer_user_id, title, description, status, created_by, assigned_at)
select c.id, '{"en":"Foundation strength","es":"Fuerza base","it":"Forza base"}', '{"en":"Basic full-body plan."}', 'active', a.id, now() from c, a
on conflict do nothing;

with c as (select id from public.profiles where email = 'customer1@example.com' limit 1),
     p as (select id, price, currency from public.packages order by credit_quantity limit 1)
insert into public.payments(customer_user_id, package_id, amount, currency, method, status)
select c.id, p.id, p.price, p.currency, 'bank_transfer', 'completed' from c, p
on conflict do nothing;

with c as (select id from public.profiles where email = 'customer1@example.com' limit 1)
insert into public.session_credit_ledger(customer_user_id, quantity, reason, note)
select c.id, 4, 'payment_unlock', 'Demo opening balance' from c
on conflict do nothing;

with c as (select id from public.profiles where email = 'customer1@example.com' limit 1)
insert into public.body_metrics(customer_user_id, measured_at, weight_kg, body_fat_percent, waist_cm, notes)
select c.id, current_date - 14, 82.5, 22, 91, 'Initial metric' from c
union all
select c.id, current_date, 81.4, 21.5, 89.5, 'Progress update' from c
on conflict do nothing;

with c as (select id from public.profiles where email = 'customer1@example.com' limit 1)
insert into public.notifications(recipient_user_id, title, message)
select c.id, 'Welcome', 'Your training dashboard is ready.' from c
on conflict do nothing;
