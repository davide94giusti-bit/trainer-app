-- Trainer App Row Level Security policies.
-- Run after schema.sql and functions.sql.

alter table public.profiles enable row level security;
alter table public.trainer_profiles enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.customer_private_notes enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_media enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_plan_exercises enable row level security;
alter table public.sessions enable row level security;
alter table public.session_participants enable row level security;
alter table public.session_exercises enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.booking_requests enable row level security;
alter table public.reschedule_requests enable row level security;
alter table public.cancellation_logs enable row level security;
alter table public.shared_session_requests enable row level security;
alter table public.packages enable row level security;
alter table public.payments enable row level security;
alter table public.session_credit_ledger enable row level security;
alter table public.body_metrics enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.app_settings enable row level security;
alter table public.audit_logs enable row level security;

-- profiles
create policy profiles_read_self_or_admin on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_insert_admin on public.profiles for insert with check (public.is_admin());
create policy profiles_update_self_safe_or_admin on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- trainer profiles
create policy trainer_profiles_read_active on public.trainer_profiles for select using (public.is_active_user());
create policy trainer_profiles_admin_write on public.trainer_profiles for all using (public.is_admin()) with check (public.is_admin());

-- customer profiles and admin-only notes
create policy customer_profiles_read_self_or_admin on public.customer_profiles for select using (user_id = auth.uid() or public.is_admin());
create policy customer_profiles_admin_write on public.customer_profiles for all using (public.is_admin()) with check (public.is_admin());
create policy customer_private_notes_admin_only on public.customer_private_notes for all using (public.is_admin()) with check (public.is_admin());

-- exercises/media
create policy exercises_read_active_or_admin on public.exercises for select using (status = 'active' and public.is_active_user() or public.is_admin());
create policy exercises_admin_write on public.exercises for all using (public.is_admin()) with check (public.is_admin());
create policy exercise_media_read_active_or_admin on public.exercise_media for select using (public.is_admin() or exists(select 1 from public.exercises e where e.id = exercise_id and e.status = 'active') and public.is_active_user());
create policy exercise_media_admin_write on public.exercise_media for all using (public.is_admin()) with check (public.is_admin());

-- workout plans/exercises
create policy workout_plans_read_assigned_or_admin on public.workout_plans for select using (public.is_admin() or (customer_user_id = auth.uid() and status = 'active'));
create policy workout_plans_admin_write on public.workout_plans for all using (public.is_admin()) with check (public.is_admin());
create policy workout_plan_exercises_read_assigned_or_admin on public.workout_plan_exercises for select using (public.is_admin() or exists(select 1 from public.workout_plans wp where wp.id = workout_plan_id and wp.customer_user_id = auth.uid() and wp.status = 'active'));
create policy workout_plan_exercises_admin_write on public.workout_plan_exercises for all using (public.is_admin()) with check (public.is_admin());

-- sessions and session children
create policy sessions_read_participant_or_admin on public.sessions for select using (public.is_admin() or customer_user_id = auth.uid() or exists(select 1 from public.session_participants sp where sp.session_id = id and sp.customer_user_id = auth.uid()));
create policy sessions_admin_write on public.sessions for all using (public.is_admin()) with check (public.is_admin());
create policy sessions_customer_cancel_update on public.sessions for update using (customer_user_id = auth.uid() and status in ('scheduled','confirmed')) with check (customer_user_id = auth.uid());
create policy session_participants_read_self_or_admin on public.session_participants for select using (public.is_admin() or customer_user_id = auth.uid());
create policy session_participants_admin_write on public.session_participants for all using (public.is_admin()) with check (public.is_admin());
create policy session_exercises_read_participant_or_admin on public.session_exercises for select using (public.is_admin() or exists(select 1 from public.sessions s where s.id = session_id and (s.customer_user_id = auth.uid() or exists(select 1 from public.session_participants sp where sp.session_id = s.id and sp.customer_user_id = auth.uid()))));
create policy session_exercises_admin_write on public.session_exercises for all using (public.is_admin()) with check (public.is_admin());

-- availability
create policy availability_rules_read_active_users on public.availability_rules for select using (public.is_active_user());
create policy availability_rules_admin_write on public.availability_rules for all using (public.is_admin()) with check (public.is_admin());
create policy availability_exceptions_read_limited on public.availability_exceptions for select using (public.is_admin() or public.is_active_user());
create policy availability_exceptions_admin_write on public.availability_exceptions for all using (public.is_admin()) with check (public.is_admin());

-- booking requests
create policy booking_requests_read_own_or_admin on public.booking_requests for select using (public.is_admin() or customer_user_id = auth.uid());
create policy booking_requests_customer_insert_own on public.booking_requests for insert with check (customer_user_id = auth.uid() and public.is_customer());
create policy booking_requests_customer_cancel_own on public.booking_requests for update using (customer_user_id = auth.uid() and status = 'pending') with check (customer_user_id = auth.uid());
create policy booking_requests_admin_write on public.booking_requests for all using (public.is_admin()) with check (public.is_admin());

-- reschedule/cancellation/shared
create policy reschedule_read_own_or_admin on public.reschedule_requests for select using (public.is_admin() or customer_user_id = auth.uid());
create policy reschedule_customer_insert_own on public.reschedule_requests for insert with check (customer_user_id = auth.uid() or public.is_admin());
create policy reschedule_admin_write on public.reschedule_requests for all using (public.is_admin()) with check (public.is_admin());
create policy cancellation_logs_read_related_or_admin on public.cancellation_logs for select using (public.is_admin() or exists(select 1 from public.sessions s where s.id = session_id and s.customer_user_id = auth.uid()));
create policy cancellation_logs_no_direct_write_except_admin on public.cancellation_logs for all using (public.is_admin()) with check (public.is_admin());
create policy shared_requests_read_related_or_admin on public.shared_session_requests for select using (public.is_admin() or requester_user_id = auth.uid() or target_customer_user_id = auth.uid());
create policy shared_requests_customer_insert on public.shared_session_requests for insert with check (requester_user_id = auth.uid() and public.is_customer());
create policy shared_requests_related_update on public.shared_session_requests for update using (public.is_admin() or requester_user_id = auth.uid() or target_customer_user_id = auth.uid()) with check (public.is_admin() or requester_user_id = auth.uid() or target_customer_user_id = auth.uid());

-- packages/payment/credits
create policy packages_read_active on public.packages for select using (status = 'active' or public.is_admin());
create policy packages_admin_write on public.packages for all using (public.is_admin()) with check (public.is_admin());
create policy payments_read_own_or_admin on public.payments for select using (public.is_admin() or customer_user_id = auth.uid());
create policy payments_admin_write on public.payments for all using (public.is_admin()) with check (public.is_admin());
create policy credit_ledger_read_own_or_admin on public.session_credit_ledger for select using (public.is_admin() or customer_user_id = auth.uid());
create policy credit_ledger_admin_insert on public.session_credit_ledger for insert with check (public.is_admin());
-- no update/delete policy: ledger is append-only.

-- body metrics
create policy body_metrics_read_own_or_admin on public.body_metrics for select using (public.is_admin() or customer_user_id = auth.uid());
create policy body_metrics_admin_write on public.body_metrics for all using (public.is_admin()) with check (public.is_admin());

-- notifications
create policy notifications_read_own_or_admin on public.notifications for select using (public.is_admin() or recipient_user_id = auth.uid());
create policy notifications_update_own_read_status on public.notifications for update using (recipient_user_id = auth.uid() or public.is_admin()) with check (recipient_user_id = auth.uid() or public.is_admin());
create policy notifications_admin_insert on public.notifications for insert with check (public.is_admin());
create policy notification_deliveries_admin_only on public.notification_deliveries for all using (public.is_admin()) with check (public.is_admin());

-- settings and audit
create policy app_settings_read_active on public.app_settings for select using (public.is_active_user());
create policy app_settings_admin_write on public.app_settings for all using (public.is_admin()) with check (public.is_admin());
create policy audit_logs_admin_read on public.audit_logs for select using (public.is_admin());
-- no direct insert/update/delete to audit_logs from clients. Inserts happen through security definer RPC.
