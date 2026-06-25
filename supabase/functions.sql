-- Trainer App security helpers and RPC business logic.
-- Run after schema.sql and before policies.sql.

create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$ select auth.uid(); $$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$ select role from public.profiles where id = auth.uid(); $$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active'); $$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and status = 'active'); $$;

create or replace function public.is_customer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'customer' and status = 'active'); $$;

create or replace function public.owns_customer_record(customer_user_id uuid)
returns boolean
language sql
stable
as $$ select auth.uid() = customer_user_id; $$;

create or replace function public.assert_admin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin role required' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.assert_active()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_active_user() then
    raise exception 'Active authenticated user required' using errcode = '42501';
  end if;
end;
$$;



create or replace function public.protect_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if auth.uid() is null or auth.uid() <> old.id then
    raise exception 'Not allowed to update this profile' using errcode = '42501';
  end if;
  if new.role <> old.role or new.status <> old.status or new.force_password_change <> old.force_password_change or new.email is distinct from old.email then
    raise exception 'Only admins can modify role, status, email, or onboarding flags' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_sensitive_fields_trigger on public.profiles;
create trigger protect_profile_sensitive_fields_trigger
before update on public.profiles
for each row execute function public.protect_profile_sensitive_fields();

create or replace function public.audit(action text, entity_table text default null, entity_id uuid default null, metadata jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs(actor_user_id, action, entity_table, entity_id, metadata)
  values (auth.uid(), action, entity_table, entity_id, coalesce(metadata, '{}'::jsonb));
end;
$$;

create or replace function public.app_setting_text(setting_key text, fallback text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select trim(both '"' from value::text) from public.app_settings where key = setting_key), fallback);
$$;

create or replace function public.app_setting_number(setting_key text, fallback numeric)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select (value #>> '{}')::numeric from public.app_settings where key = setting_key), fallback);
$$;

create or replace function public.get_default_trainer_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where role = 'admin' and status = 'active' order by created_at limit 1;
$$;

create or replace function public.is_slot_available(trainer_user_id uuid, start_at timestamptz, end_at timestamptz)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if start_at >= end_at then return false; end if;
  if start_at < now() then return false; end if;

  if exists (
    select 1 from public.sessions s
    where s.trainer_user_id = is_slot_available.trainer_user_id
      and s.status in ('scheduled','confirmed')
      and tstzrange(s.start_at, s.end_at, '[)') && tstzrange(start_at, end_at, '[)')
  ) then return false; end if;

  if exists (
    select 1 from public.availability_exceptions e
    where e.trainer_user_id = is_slot_available.trainer_user_id
      and e.exception_type = 'unavailable'
      and tstzrange(e.start_at, e.end_at, '[)') && tstzrange(start_at, end_at, '[)')
  ) then return false; end if;

  return true;
end;
$$;

-- Admin customer functions. These create app profiles; actual auth user creation/invite is done via Supabase Admin API.
create or replace function public.create_customer_profile(email text, full_name text, phone text default null, objective text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  found_user uuid;
begin
  perform public.assert_admin();
  select id into found_user from auth.users where lower(auth.users.email) = lower(create_customer_profile.email) limit 1;
  if found_user is null then
    raise exception 'Auth user not found for %. Invite/create the user first through Supabase Auth or the Cloudflare Pages Function.', email;
  end if;

  insert into public.profiles(id, role, status, full_name, email, phone, force_password_change)
  values (found_user, 'customer', 'invited', full_name, lower(email), phone, true)
  on conflict (id) do update set full_name = excluded.full_name, email = excluded.email, phone = excluded.phone, role = 'customer';

  insert into public.customer_profiles(user_id, objective)
  values (found_user, objective)
  on conflict (user_id) do update set objective = excluded.objective;

  perform public.audit('create_customer_profile', 'profiles', found_user, jsonb_build_object('email', email));
  return found_user;
end;
$$;

create or replace function public.deactivate_customer(customer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  update public.profiles set status = 'deactivated' where id = customer_id and role = 'customer';
  perform public.audit('deactivate_customer', 'profiles', customer_id);
end;
$$;

create or replace function public.reactivate_customer(customer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  update public.profiles set status = 'active' where id = customer_id and role = 'customer';
  perform public.audit('reactivate_customer', 'profiles', customer_id);
end;
$$;

create or replace function public.reset_customer_onboarding(customer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  update public.profiles set status = 'invited', force_password_change = true where id = customer_id and role = 'customer';
  perform public.audit('reset_customer_onboarding', 'profiles', customer_id);
end;
$$;

create or replace function public.set_customer_language(customer_id uuid, language text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  update public.profiles set language = set_customer_language.language::public.language_code where id = customer_id and role = 'customer';
  perform public.audit('set_customer_language', 'profiles', customer_id, jsonb_build_object('language', language));
end;
$$;

create or replace function public.assign_workout_plan(plan_id uuid, customer_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  update public.workout_plans set customer_user_id = assign_workout_plan.customer_user_id, status = 'active', assigned_at = now() where id = plan_id;
  perform public.audit('assign_workout_plan', 'workout_plans', plan_id, jsonb_build_object('customer_user_id', customer_user_id));
end;
$$;

create or replace function public.archive_exercise(exercise_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  update public.exercises set status = 'archived' where id = exercise_id;
  perform public.audit('archive_exercise', 'exercises', exercise_id);
end;
$$;

create or replace function public.archive_workout_plan(plan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  update public.workout_plans set status = 'archived' where id = plan_id;
  perform public.audit('archive_workout_plan', 'workout_plans', plan_id);
end;
$$;

create or replace function public.get_customer_credit_balance(customer_user_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select case when public.is_admin() or auth.uid() = customer_user_id then coalesce(sum(quantity), 0) else null end
  from public.session_credit_ledger
  where customer_user_id = get_customer_credit_balance.customer_user_id;
$$;

create or replace function public.get_my_credit_balance()
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(quantity), 0) from public.session_credit_ledger where customer_user_id = auth.uid();
$$;

create or replace function public.request_booking(requested_start timestamptz, requested_end timestamptz, notes text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  trainer_id uuid;
  request_id uuid;
  booking_without_credits boolean;
begin
  perform public.assert_active();
  if not public.is_customer() then raise exception 'Customer role required' using errcode = '42501'; end if;
  if requested_start >= requested_end then raise exception 'Invalid booking window'; end if;

  booking_without_credits := coalesce((select (value #>> '{}')::boolean from public.app_settings where key = 'booking_without_credits'), false);
  if not booking_without_credits and public.get_my_credit_balance() <= 0 then
    raise exception 'No session credits available';
  end if;

  trainer_id := public.get_default_trainer_user_id();
  if trainer_id is null then raise exception 'No active trainer configured'; end if;

  if not public.is_slot_available(trainer_id, requested_start, requested_end) then
    raise exception 'Requested slot is not available';
  end if;

  insert into public.booking_requests(customer_user_id, trainer_user_id, requested_start, requested_end, notes)
  values (auth.uid(), trainer_id, requested_start, requested_end, notes)
  returning id into request_id;

  insert into public.notifications(recipient_user_id, title, message, data)
  values (trainer_id, 'New booking request', 'A customer requested a session.', jsonb_build_object('booking_request_id', request_id));

  perform public.audit('request_booking', 'booking_requests', request_id);
  return request_id;
end;
$$;

create or replace function public.cancel_booking_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_active();
  update public.booking_requests
  set status = 'cancelled'
  where id = request_id and customer_user_id = auth.uid() and status = 'pending';
  perform public.audit('cancel_booking_request', 'booking_requests', request_id);
end;
$$;

create or replace function public.accept_booking_request(request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  br public.booking_requests%rowtype;
  new_session_id uuid;
begin
  perform public.assert_admin();
  select * into br from public.booking_requests where id = request_id for update;
  if br.id is null then raise exception 'Booking request not found'; end if;
  if br.status <> 'pending' then raise exception 'Booking request is not pending'; end if;

  if not public.is_slot_available(br.trainer_user_id, br.requested_start, br.requested_end) then
    update public.booking_requests set status = 'conflicted', decided_at = now(), decided_by = auth.uid() where id = request_id;
    perform public.audit('accept_booking_conflicted', 'booking_requests', request_id);
    return null;
  end if;

  insert into public.sessions(trainer_user_id, customer_user_id, session_type, status, start_at, end_at)
  values (br.trainer_user_id, br.customer_user_id, 'private', 'confirmed', br.requested_start, br.requested_end)
  returning id into new_session_id;

  insert into public.session_participants(session_id, customer_user_id, status, accepted_at)
  values (new_session_id, br.customer_user_id, 'accepted', now());

  update public.booking_requests set status = 'accepted', decided_by = auth.uid(), decided_at = now() where id = request_id;
  insert into public.notifications(recipient_user_id, title, message, data)
  values (br.customer_user_id, 'Booking accepted', 'Your requested session has been confirmed.', jsonb_build_object('session_id', new_session_id));

  perform public.audit('accept_booking_request', 'booking_requests', request_id, jsonb_build_object('session_id', new_session_id));
  return new_session_id;
end;
$$;

create or replace function public.decline_booking_request(request_id uuid, reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare br public.booking_requests%rowtype;
begin
  perform public.assert_admin();
  select * into br from public.booking_requests where id = request_id for update;
  if br.id is null then raise exception 'Booking request not found'; end if;
  update public.booking_requests set status = 'declined', admin_message = reason, decided_by = auth.uid(), decided_at = now() where id = request_id;
  insert into public.notifications(recipient_user_id, title, message, data) values (br.customer_user_id, 'Booking declined', coalesce(reason, 'Your booking request was declined.'), jsonb_build_object('booking_request_id', request_id));
  perform public.audit('decline_booking_request', 'booking_requests', request_id, jsonb_build_object('reason', reason));
end;
$$;

create or replace function public.propose_booking_time(request_id uuid, proposed_start timestamptz, proposed_end timestamptz, message text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare br public.booking_requests%rowtype;
begin
  perform public.assert_admin();
  select * into br from public.booking_requests where id = request_id for update;
  if proposed_start >= proposed_end then raise exception 'Invalid proposed time'; end if;
  update public.booking_requests set status = 'proposed_alternative', proposed_start = propose_booking_time.proposed_start, proposed_end = propose_booking_time.proposed_end, admin_message = propose_booking_time.message, decided_by = auth.uid(), decided_at = now() where id = request_id;
  insert into public.notifications(recipient_user_id, title, message, data) values (br.customer_user_id, 'Alternative booking time', coalesce(message, 'Your trainer proposed a new time.'), jsonb_build_object('booking_request_id', request_id));
  perform public.audit('propose_booking_time', 'booking_requests', request_id);
end;
$$;

create or replace function public.create_manual_session(customer_user_id uuid, start_at timestamptz, end_at timestamptz, workout_plan_id uuid default null, notes text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare trainer_id uuid; new_session_id uuid;
begin
  perform public.assert_admin();
  if start_at >= end_at then raise exception 'Invalid session time'; end if;
  trainer_id := auth.uid();
  if not public.is_slot_available(trainer_id, start_at, end_at) then raise exception 'Slot unavailable'; end if;
  insert into public.sessions(trainer_user_id, customer_user_id, workout_plan_id, status, start_at, end_at, notes)
  values (trainer_id, customer_user_id, workout_plan_id, 'confirmed', start_at, end_at, notes)
  returning id into new_session_id;
  insert into public.session_participants(session_id, customer_user_id, status, accepted_at) values (new_session_id, customer_user_id, 'accepted', now());
  insert into public.notifications(recipient_user_id, title, message, data) values (customer_user_id, 'New session scheduled', 'Your trainer scheduled a session.', jsonb_build_object('session_id', new_session_id));
  perform public.audit('create_manual_session', 'sessions', new_session_id);
  return new_session_id;
end;
$$;

create or replace function public.complete_session(session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare s public.sessions%rowtype;
begin
  perform public.assert_admin();
  select * into s from public.sessions where id = session_id for update;
  if s.id is null then raise exception 'Session not found'; end if;
  if s.status = 'completed' then raise exception 'Session already completed'; end if;
  if not s.credit_consumed and s.customer_user_id is not null then
    insert into public.session_credit_ledger(customer_user_id, quantity, reason, session_id, note, created_by)
    values (s.customer_user_id, -1, 'session_completed', session_id, 'Session completed', auth.uid());
  end if;
  update public.sessions set status = 'completed', credit_consumed = true where id = session_id;
  if s.customer_user_id is not null then
    insert into public.notifications(recipient_user_id, title, message, data) values (s.customer_user_id, 'Session completed', 'Your session was marked completed.', jsonb_build_object('session_id', session_id));
  end if;
  perform public.audit('complete_session', 'sessions', session_id);
end;
$$;

create or replace function public.mark_session_no_show(session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  update public.sessions set status = 'no_show' where id = session_id and status <> 'completed';
  perform public.audit('mark_session_no_show', 'sessions', session_id);
end;
$$;

create or replace function public.cancel_session(session_id uuid, reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.sessions%rowtype;
  hours_before numeric;
  window_hours numeric;
  policy text;
  credit_action public.cancellation_credit_action := 'none';
begin
  perform public.assert_active();
  select * into s from public.sessions where id = session_id for update;
  if s.id is null then raise exception 'Session not found'; end if;
  if not public.is_admin() and s.customer_user_id <> auth.uid() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if s.status in ('completed','cancelled') then raise exception 'Cannot cancel completed/cancelled session'; end if;

  hours_before := extract(epoch from (s.start_at - now())) / 3600;
  window_hours := public.app_setting_number('cancellation_window_hours', 24);
  policy := public.app_setting_text('late_cancel_policy', 'consume_credit');

  if hours_before < window_hours and s.customer_user_id is not null and not s.credit_consumed then
    if policy = 'consume_credit' then
      insert into public.session_credit_ledger(customer_user_id, quantity, reason, session_id, note, created_by)
      values (s.customer_user_id, -1, 'late_cancel', session_id, 'Late cancellation', auth.uid());
      credit_action := 'consumed';
    elsif policy = 'manual_review' then
      credit_action := 'manual_review';
    end if;
  end if;

  update public.sessions set status = 'cancelled', cancelled_at = now(), cancellation_reason = reason, credit_consumed = credit_consumed or credit_action = 'consumed' where id = session_id;
  insert into public.cancellation_logs(session_id, actor_user_id, cancelled_hours_before, credit_action, policy_snapshot, reason)
  values (session_id, auth.uid(), hours_before, credit_action, jsonb_build_object('window_hours', window_hours, 'policy', policy), reason);
  if s.customer_user_id is not null and auth.uid() <> s.customer_user_id then
    insert into public.notifications(recipient_user_id, title, message, data) values (s.customer_user_id, 'Session cancelled', coalesce(reason, 'A session was cancelled.'), jsonb_build_object('session_id', session_id));
  end if;
  perform public.audit('cancel_session', 'sessions', session_id, jsonb_build_object('credit_action', credit_action));
end;
$$;

create or replace function public.request_reschedule(session_id uuid, requested_start timestamptz, requested_end timestamptz, reason text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare new_id uuid; s public.sessions%rowtype;
begin
  perform public.assert_active();
  select * into s from public.sessions where id = session_id;
  if s.id is null then raise exception 'Session not found'; end if;
  if not public.is_admin() and s.customer_user_id <> auth.uid() then raise exception 'Not allowed' using errcode = '42501'; end if;
  insert into public.reschedule_requests(session_id, customer_user_id, requested_start, requested_end, reason)
  values (session_id, coalesce(s.customer_user_id, auth.uid()), requested_start, requested_end, reason)
  returning id into new_id;
  perform public.audit('request_reschedule', 'reschedule_requests', new_id);
  return new_id;
end;
$$;

create or replace function public.mark_payment_completed(payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare p public.payments%rowtype; credits numeric;
begin
  perform public.assert_admin();
  select * into p from public.payments where id = payment_id for update;
  if p.id is null then raise exception 'Payment not found'; end if;
  if p.status = 'completed' then raise exception 'Payment already completed'; end if;
  if p.package_id is null then raise exception 'Payment has no package'; end if;
  select credit_quantity into credits from public.packages where id = p.package_id;
  insert into public.session_credit_ledger(customer_user_id, quantity, reason, payment_id, note, created_by)
  values (p.customer_user_id, credits, 'payment_unlock', payment_id, 'Payment completed', auth.uid());
  update public.payments set status = 'completed', completed_at = now() where id = payment_id;
  insert into public.notifications(recipient_user_id, title, message, data) values (p.customer_user_id, 'Payment completed', 'Your credits are now available.', jsonb_build_object('payment_id', payment_id, 'credits', credits));
  perform public.audit('mark_payment_completed', 'payments', payment_id, jsonb_build_object('credits', credits));
end;
$$;

create or replace function public.mark_payment_rejected(payment_id uuid, reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare p public.payments%rowtype;
begin
  perform public.assert_admin();
  select * into p from public.payments where id = payment_id for update;
  update public.payments set status = 'rejected', rejection_reason = reason where id = payment_id;
  insert into public.notifications(recipient_user_id, title, message, data) values (p.customer_user_id, 'Payment rejected', coalesce(reason, 'Your payment could not be confirmed.'), jsonb_build_object('payment_id', payment_id));
  perform public.audit('mark_payment_rejected', 'payments', payment_id, jsonb_build_object('reason', reason));
end;
$$;

create or replace function public.adjust_customer_credits(customer_user_id uuid, quantity numeric, reason text default 'admin_adjustment')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  insert into public.session_credit_ledger(customer_user_id, quantity, reason, note, created_by)
  values (customer_user_id, quantity, 'admin_adjustment', reason, auth.uid());
  perform public.audit('adjust_customer_credits', 'session_credit_ledger', null, jsonb_build_object('customer_user_id', customer_user_id, 'quantity', quantity, 'reason', reason));
end;
$$;

create or replace function public.mark_notification_read(notification_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_active();
  update public.notifications set status = 'read', read_at = now() where id = notification_id and recipient_user_id = auth.uid();
end;
$$;

create or replace function public.create_admin_announcement(title text, message text, recipient_mode text default 'all')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  if recipient_mode = 'customers' then
    insert into public.notifications(recipient_user_id, title, message)
    select id, title, message from public.profiles where role = 'customer' and status = 'active';
  else
    insert into public.notifications(recipient_user_id, title, message)
    select id, title, message from public.profiles where status = 'active';
  end if;
  perform public.audit('create_admin_announcement', 'notifications', null, jsonb_build_object('recipient_mode', recipient_mode));
end;
$$;

create or replace function public.get_public_availability(start_date date, end_date date)
returns table(slot_start timestamptz, slot_end timestamptz, available boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  trainer_id uuid;
  d date;
  r record;
  slot_start_ts timestamptz;
  slot_end_ts timestamptz;
begin
  perform public.assert_active();
  trainer_id := public.get_default_trainer_user_id();
  if trainer_id is null then return; end if;
  d := start_date;
  while d <= end_date loop
    for r in select * from public.availability_rules where trainer_user_id = trainer_id and is_active and day_of_week = extract(dow from d)::int loop
      slot_start_ts := (d::text || ' ' || r.start_time::text)::timestamp at time zone 'Europe/Zurich';
      while slot_start_ts + make_interval(mins => r.slot_minutes) <= ((d::text || ' ' || r.end_time::text)::timestamp at time zone 'Europe/Zurich') loop
        slot_end_ts := slot_start_ts + make_interval(mins => r.slot_minutes);
        slot_start := slot_start_ts;
        slot_end := slot_end_ts;
        available := public.is_slot_available(trainer_id, slot_start_ts, slot_end_ts);
        return next;
        slot_start_ts := slot_end_ts;
      end loop;
    end loop;
    d := d + 1;
  end loop;
end;
$$;
