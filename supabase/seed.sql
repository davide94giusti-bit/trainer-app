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

-- 2026 default app builder settings
insert into public.app_branding_settings(id, app_name, login_title, login_subtitle)
values ('default', 'Trainer App', '{"en":"Welcome back","es":"Bienvenido de nuevo","it":"Bentornato"}'::jsonb, '{"en":"Log in to manage your training.","es":"Inicia sesión para gestionar tu entrenamiento.","it":"Accedi per gestire il tuo allenamento."}'::jsonb)
on conflict (id) do nothing;

insert into public.app_dashboard_widgets(key, label, enabled, sort_order) values
('next_session', 'Next session', true, 10),
('active_workout_plan', 'Active workout plan', true, 20),
('credit_balance', 'Credit balance', true, 30),
('body_metric_progress', 'Body metric progress', true, 40),
('pending_bookings', 'Pending bookings', true, 50),
('latest_notifications', 'Latest notifications', true, 60),
('payment_status', 'Payment status', true, 70),
('trainer_message', 'Trainer message', true, 80),
('upcoming_work', 'Upcoming work', true, 90)
on conflict (key) do nothing;

insert into public.app_navigation_items(key, label, route, enabled, sort_order) values
('dashboard', 'Dashboard', '/dashboard', true, 10),
('sessions', 'Sessions', '/sessions', true, 20),
('workout_plan', 'Workout plan', '/workout-plan', true, 30),
('metrics', 'Metrics', '/metrics', true, 40),
('availability', 'Availability', '/availability', true, 50),
('payments', 'Payments', '/payments', true, 60),
('notifications', 'Notifications', '/notifications', true, 70),
('settings', 'Settings', '/settings', true, 80)
on conflict (key) do nothing;

insert into public.app_content_blocks(key, label, localized_value, enabled) values
('dashboard_welcome', 'Dashboard welcome message', '{"en":"Welcome to your training dashboard.","es":"Bienvenido a tu panel de entrenamiento.","it":"Benvenuto nella tua dashboard di allenamento."}'::jsonb, true),
('booking_instructions', 'Booking instructions', '{"en":"Choose an available training slot and submit your request.","es":"Elige un horario disponible y envía tu solicitud.","it":"Scegli uno slot disponibile e invia la richiesta."}'::jsonb, true),
('cancellation_policy', 'Cancellation policy text', '{"en":"Cancel at least 24 hours before the session to avoid credit consumption.","es":"Cancela al menos 24 horas antes para evitar consumir créditos.","it":"Annulla almeno 24 ore prima per evitare il consumo di crediti."}'::jsonb, true),
('payment_instructions', 'Payment instructions', '{"en":"Review your package and payment status here.","es":"Revisa aquí tu paquete y estado de pago.","it":"Controlla qui il tuo pacchetto e lo stato del pagamento."}'::jsonb, true),
('bank_transfer_instructions', 'Bank transfer instructions', '{"en":"Use the bank transfer details provided by your trainer.","es":"Usa los datos de transferencia proporcionados por tu entrenador.","it":"Usa i dati del bonifico forniti dal trainer."}'::jsonb, true),
('workout_instructions', 'Workout plan instructions', '{"en":"Follow the assigned workout plan and review exercise notes.","es":"Sigue el plan asignado y revisa las notas de ejercicios.","it":"Segui la scheda assegnata e consulta le note degli esercizi."}'::jsonb, true),
('metrics_explanation', 'Metrics explanation', '{"en":"Track your body metrics against your objective.","es":"Sigue tus métricas corporales frente a tu objetivo.","it":"Monitora le metriche corporee rispetto al tuo obiettivo."}'::jsonb, true),
('notification_footer', 'Notification footer', '{"en":"Contact your trainer if you have questions.","es":"Contacta con tu entrenador si tienes preguntas.","it":"Contatta il trainer se hai domande."}'::jsonb, true),
('support_help', 'Support/help text', '{"en":"Need help? Contact support or your trainer.","es":"¿Necesitas ayuda? Contacta con soporte o tu entrenador.","it":"Serve aiuto? Contatta il supporto o il trainer."}'::jsonb, true)
on conflict (key) do nothing;

insert into public.app_feature_flags(key, label, enabled) values
('booking_requests', 'Booking requests', true),
('reschedule_requests', 'Reschedule requests', true),
('payments_page', 'Payments page', true),
('credits_display', 'Credits display', true),
('body_metrics_page', 'Body metrics page', true),
('notifications', 'Notifications', true),
('shared_session_requests', 'Shared session requests', true),
('exercise_media_display', 'Exercise media display', true),
('customer_profile_editing', 'Customer profile editing', true)
on conflict (key) do nothing;

insert into public.app_policy_settings(key, label, value) values
('cancellation_window_hours', 'Cancellation window in hours', '24'::jsonb),
('late_cancel_policy', 'Late cancellation policy', '"consume_credit"'::jsonb),
('booking_without_credits', 'Booking without credits allowed', 'false'::jsonb),
('reschedule_window_hours', 'Reschedule window in hours', '24'::jsonb),
('shared_session_discount_percent', 'Shared session discount percentage', '40'::jsonb),
('default_session_duration', 'Default session duration', '60'::jsonb),
('maximum_advance_booking_days', 'Maximum advance booking days', '30'::jsonb)
on conflict (key) do nothing;

insert into public.app_settings(key, value) values
('default_language', '"en"'::jsonb),
('enabled_languages', '["en","es","it"]'::jsonb),
('cancellation_window_hours', '24'::jsonb),
('late_cancel_policy', '"consume_credit"'::jsonb),
('booking_without_credits', 'false'::jsonb),
('reschedule_window_hours', '24'::jsonb),
('shared_session_discount_percent', '40'::jsonb),
('default_session_duration', '60'::jsonb),
('maximum_advance_booking_days', '30'::jsonb)
on conflict (key) do nothing;
