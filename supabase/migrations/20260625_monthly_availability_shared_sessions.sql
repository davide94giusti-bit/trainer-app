-- Monthly customer availability calendar and shared-session request workflow.
-- Run after 20260625_admin_app_builder.sql on existing projects.

alter table public.sessions add column if not exists focus_area text;
alter table public.shared_session_requests add column if not exists requester_notes text;
alter table public.shared_session_requests add column if not exists target_responded_at timestamptz;
alter table public.shared_session_requests add column if not exists trainer_responded_at timestamptz;
alter table public.shared_session_requests add column if not exists finalized_at timestamptz;

create index if not exists sessions_focus_area_idx on public.sessions (focus_area);
create index if not exists shared_session_requests_source_idx on public.shared_session_requests (source_session_id, requester_user_id, status, trainer_status);
create unique index if not exists shared_session_requests_one_open_per_customer_session_idx
  on public.shared_session_requests(source_session_id, requester_user_id)
  where status = 'pending' and trainer_status = 'pending';

insert into public.app_feature_flags(key, label, enabled) values
('shared_session_requests', 'Shared session requests', true),
('reschedule_requests', 'Reschedule requests', true),
('booking_requests', 'Booking requests', true)
on conflict (key) do nothing;

insert into public.app_policy_settings(key, label, value) values
('shared_session_discount_percent', 'Shared session discount percentage', '40'::jsonb),
('reschedule_window_hours', 'Reschedule window in hours', '24'::jsonb)
on conflict (key) do nothing;

insert into public.app_settings(key, value) values
('shared_session_discount_percent', '40'::jsonb),
('reschedule_window_hours', '24'::jsonb)
on conflict (key) do nothing;

create or replace function public.is_feature_enabled(flag_key text, fallback boolean default true)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select enabled from public.app_feature_flags where key = flag_key), fallback);
$$;

create or replace function public.get_customer_month_availability(start_date date, end_date date, focus_filter text default null)
returns table(
  slot_date date,
  slot_start timestamptz,
  slot_end timestamptz,
  is_free boolean,
  has_session boolean,
  session_id uuid,
  session_title text,
  focus_area text,
  can_request_booking boolean,
  can_request_reschedule boolean,
  can_request_shared_session boolean,
  participant_count int,
  shared_discount_percent numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with trainer as (
    select public.get_default_trainer_user_id() as id
  ),
  days as (
    select generate_series(start_date, end_date, interval '1 day')::date as d
  ),
  rule_slots as (
    select
      days.d as slot_date,
      gs as slot_start,
      gs + make_interval(mins => ar.slot_minutes) as slot_end,
      trainer.id as trainer_user_id
    from trainer
    join days on true
    join public.availability_rules ar on ar.trainer_user_id = trainer.id
      and ar.is_active
      and ar.day_of_week = extract(dow from days.d)::int
    cross join lateral generate_series(
      (days.d::text || ' ' || ar.start_time::text)::timestamp at time zone 'Europe/Zurich',
      ((days.d::text || ' ' || ar.end_time::text)::timestamp at time zone 'Europe/Zurich') - make_interval(mins => ar.slot_minutes),
      make_interval(mins => ar.slot_minutes)
    ) as gs
    where trainer.id is not null
  ),
  decorated as (
    select
      rs.slot_date,
      rs.slot_start,
      rs.slot_end,
      s.id as session_id,
      coalesce(nullif(s.focus_area, ''), nullif(exercise_focus.focus_area, ''), nullif(wp.title->>'en', ''), 'Training session') as session_title,
      coalesce(nullif(s.focus_area, ''), nullif(exercise_focus.focus_area, ''), nullif(lower(wp.title->>'en'), ''), null) as focus_area,
      coalesce(participants.participant_count, 0)::int as participant_count,
      public.is_slot_available(rs.trainer_user_id, rs.slot_start, rs.slot_end) as free_slot,
      public.app_setting_number('shared_session_discount_percent', 40) as shared_discount_percent,
      s.status as session_status,
      s.customer_user_id,
      s.session_type
    from rule_slots rs
    left join public.sessions s on s.trainer_user_id = rs.trainer_user_id
      and s.status in ('scheduled', 'confirmed')
      and tstzrange(s.start_at, s.end_at, '[)') && tstzrange(rs.slot_start, rs.slot_end, '[)')
    left join public.workout_plans wp on wp.id = s.workout_plan_id
    left join lateral (
      select e.category as focus_area
      from public.session_exercises se
      join public.exercises e on e.id = se.exercise_id
      where se.session_id = s.id and e.category is not null
      order by se.sort_order
      limit 1
    ) exercise_focus on true
    left join lateral (
      select count(*)::int as participant_count
      from public.session_participants sp
      where sp.session_id = s.id and sp.status in ('invited', 'accepted')
    ) participants on true
  ),
  visible as (
    select * from decorated where free_slot or session_id is not null
  ),
  calculated as (
    select
      visible.slot_date,
      visible.slot_start,
      visible.slot_end,
      visible.free_slot as is_free,
      (visible.session_id is not null) as has_session,
      visible.session_id,
      visible.session_title,
      visible.focus_area,
      (visible.free_slot and public.is_feature_enabled('booking_requests', true)) as can_request_booking,
      (visible.free_slot and public.is_feature_enabled('reschedule_requests', true)) as can_request_reschedule,
      (
        visible.session_id is not null
        and public.is_feature_enabled('shared_session_requests', true)
        and visible.session_status in ('scheduled', 'confirmed')
        and visible.customer_user_id is not null
        and visible.customer_user_id <> auth.uid()
        and visible.participant_count < 2
        and not exists (
          select 1 from public.session_participants sp
          where sp.session_id = visible.session_id and sp.customer_user_id = auth.uid()
        )
        and not exists (
          select 1 from public.shared_session_requests ssr
          where ssr.source_session_id = visible.session_id
            and ssr.requester_user_id = auth.uid()
            and ssr.status = 'pending'
            and ssr.trainer_status = 'pending'
        )
      ) as can_request_shared_session,
      visible.participant_count,
      visible.shared_discount_percent
    from visible
  )
  select *
  from calculated
  where public.is_active_user()
    and (
      focus_filter is null
      or btrim(focus_filter) = ''
      or lower(focus_filter) = 'all'
      or (lower(focus_filter) = 'available' and calculated.is_free)
      or (not calculated.is_free and lower(coalesce(calculated.focus_area, '')) = lower(focus_filter))
    )
  order by slot_start;
$$;

create or replace function public.request_reschedule(session_id uuid, requested_start timestamptz, requested_end timestamptz, reason text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  s public.sessions%rowtype;
  hours_before numeric;
  window_hours numeric;
begin
  perform public.assert_active();
  if not public.is_feature_enabled('reschedule_requests', true) then
    raise exception 'Reschedule requests are currently disabled';
  end if;
  if requested_start >= requested_end then raise exception 'Invalid reschedule window'; end if;

  select * into s from public.sessions where id = request_reschedule.session_id for update;
  if s.id is null then raise exception 'Session not found'; end if;
  if not public.is_admin()
    and s.customer_user_id <> auth.uid()
    and not exists (select 1 from public.session_participants sp where sp.session_id = request_reschedule.session_id and sp.customer_user_id = auth.uid()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  hours_before := extract(epoch from (s.start_at - now())) / 3600;
  window_hours := public.app_setting_number('reschedule_window_hours', 24);
  if hours_before < window_hours and not public.is_admin() then
    raise exception 'This session is inside the reschedule window';
  end if;

  if not public.is_slot_available(s.trainer_user_id, requested_start, requested_end) then
    raise exception 'Requested reschedule slot is not available';
  end if;

  insert into public.reschedule_requests(session_id, customer_user_id, requested_start, requested_end, reason)
  values (request_reschedule.session_id, auth.uid(), requested_start, requested_end, reason)
  returning id into new_id;

  insert into public.notifications(recipient_user_id, title, message, data)
  values (
    s.trainer_user_id,
    'New reschedule request',
    'A customer requested to move a scheduled session.',
    jsonb_build_object('reschedule_request_id', new_id, 'session_id', request_reschedule.session_id, 'requested_start', requested_start, 'requested_end', requested_end)
  );

  perform public.audit('request_reschedule', 'reschedule_requests', new_id, jsonb_build_object('session_id', request_reschedule.session_id));
  return new_id;
end;
$$;

create or replace function public._finalize_shared_session_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ssr public.shared_session_requests%rowtype;
  s public.sessions%rowtype;
begin
  perform public.assert_active();
  select * into ssr from public.shared_session_requests where id = _finalize_shared_session_request.request_id for update;
  if ssr.id is null then return; end if;
  if not public.is_admin() and auth.uid() not in (ssr.requester_user_id, ssr.target_customer_user_id) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if ssr.status <> 'accepted' or ssr.trainer_status <> 'accepted' or ssr.finalized_at is not null then return; end if;

  select * into s from public.sessions where id = ssr.source_session_id for update;
  if s.id is null then raise exception 'Session not found'; end if;
  if exists (select 1 from public.session_participants sp where sp.session_id = s.id and sp.customer_user_id = ssr.requester_user_id) then
    update public.shared_session_requests set finalized_at = now() where id = ssr.id;
    return;
  end if;
  if (select count(*) from public.session_participants sp where sp.session_id = s.id and sp.status in ('invited', 'accepted')) >= 2 then
    raise exception 'Session already has the maximum number of participants';
  end if;

  update public.sessions set session_type = 'shared' where id = s.id;
  insert into public.session_participants(session_id, customer_user_id, status, accepted_at)
  values (s.id, ssr.target_customer_user_id, 'accepted', now())
  on conflict (session_id, customer_user_id) do update set status = 'accepted', accepted_at = coalesce(session_participants.accepted_at, now());
  insert into public.session_participants(session_id, customer_user_id, status, accepted_at)
  values (s.id, ssr.requester_user_id, 'accepted', now())
  on conflict (session_id, customer_user_id) do update set status = 'accepted', accepted_at = coalesce(session_participants.accepted_at, now());

  update public.shared_session_requests set finalized_at = now() where id = ssr.id;

  insert into public.notifications(recipient_user_id, title, message, data) values
    (ssr.requester_user_id, 'Shared session approved', 'The trainer and the other customer approved your shared-session request.', jsonb_build_object('shared_session_request_id', ssr.id, 'session_id', s.id)),
    (ssr.target_customer_user_id, 'Shared session approved', 'The shared session has been approved by the trainer.', jsonb_build_object('shared_session_request_id', ssr.id, 'session_id', s.id));
  perform public.audit('finalize_shared_session_request', 'shared_session_requests', ssr.id, jsonb_build_object('session_id', s.id));
end;
$$;

create or replace function public.request_shared_session(source_session_id uuid, notes text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.sessions%rowtype;
  request_id uuid;
  participant_count int;
begin
  perform public.assert_active();
  if not public.is_customer() then raise exception 'Customer role required' using errcode = '42501'; end if;
  if not public.is_feature_enabled('shared_session_requests', true) then raise exception 'Shared-session requests are currently disabled'; end if;

  select * into s from public.sessions where id = source_session_id for update;
  if s.id is null then raise exception 'Session not found'; end if;
  if s.status not in ('scheduled', 'confirmed') then raise exception 'This session cannot be shared'; end if;
  if s.customer_user_id is null then raise exception 'This session does not have a primary customer'; end if;
  if s.customer_user_id = auth.uid() then raise exception 'You already own this session'; end if;
  if exists (select 1 from public.session_participants sp where sp.session_id = source_session_id and sp.customer_user_id = auth.uid()) then
    raise exception 'You are already part of this session';
  end if;
  select count(*) into participant_count from public.session_participants sp where sp.session_id = source_session_id and sp.status in ('invited', 'accepted');
  if participant_count >= 2 then raise exception 'This session is already full'; end if;

  insert into public.shared_session_requests(source_session_id, requester_user_id, target_customer_user_id, requester_notes)
  values (source_session_id, auth.uid(), s.customer_user_id, notes)
  returning id into request_id;

  insert into public.notifications(recipient_user_id, title, message, data) values
    (s.trainer_user_id, 'New shared-session request', 'A customer requested to join an existing session.', jsonb_build_object('shared_session_request_id', request_id, 'session_id', source_session_id)),
    (s.customer_user_id, 'Shared-session approval needed', 'Another customer requested to join your session.', jsonb_build_object('shared_session_request_id', request_id, 'session_id', source_session_id));

  perform public.audit('request_shared_session', 'shared_session_requests', request_id, jsonb_build_object('source_session_id', source_session_id));
  return request_id;
end;
$$;

create or replace function public.respond_shared_session_request(request_id uuid, decision text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ssr public.shared_session_requests%rowtype;
  s public.sessions%rowtype;
  normalized public.shared_request_status;
begin
  perform public.assert_active();
  if decision not in ('accepted', 'declined') then raise exception 'Decision must be accepted or declined'; end if;
  normalized := decision::public.shared_request_status;

  select * into ssr from public.shared_session_requests where id = respond_shared_session_request.request_id for update;
  if ssr.id is null then raise exception 'Shared-session request not found'; end if;
  if ssr.target_customer_user_id <> auth.uid() then raise exception 'Only the current session customer can respond' using errcode = '42501'; end if;
  if ssr.status <> 'pending' then raise exception 'This request has already been answered'; end if;
  select * into s from public.sessions where id = ssr.source_session_id;

  update public.shared_session_requests
  set status = normalized, target_responded_at = now()
  where id = respond_shared_session_request.request_id;

  if normalized = 'accepted' then
    insert into public.notifications(recipient_user_id, title, message, data) values
      (ssr.requester_user_id, 'Customer approved shared session', 'The other customer approved your shared-session request. Trainer approval may still be required.', jsonb_build_object('shared_session_request_id', request_id)),
      (s.trainer_user_id, 'Customer approved shared session', 'The existing customer approved a shared-session request.', jsonb_build_object('shared_session_request_id', request_id));
    perform public._finalize_shared_session_request(request_id);
  else
    insert into public.notifications(recipient_user_id, title, message, data) values
      (ssr.requester_user_id, 'Shared session declined', 'The other customer declined your shared-session request.', jsonb_build_object('shared_session_request_id', request_id)),
      (s.trainer_user_id, 'Shared session declined', 'The existing customer declined a shared-session request.', jsonb_build_object('shared_session_request_id', request_id));
  end if;

  perform public.audit('respond_shared_session_request', 'shared_session_requests', request_id, jsonb_build_object('decision', decision));
end;
$$;

create or replace function public.trainer_decide_shared_session_request(request_id uuid, decision text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ssr public.shared_session_requests%rowtype;
  normalized public.shared_request_status;
begin
  perform public.assert_admin();
  if decision not in ('accepted', 'declined') then raise exception 'Decision must be accepted or declined'; end if;
  normalized := decision::public.shared_request_status;

  select * into ssr from public.shared_session_requests where id = trainer_decide_shared_session_request.request_id for update;
  if ssr.id is null then raise exception 'Shared-session request not found'; end if;
  if ssr.trainer_status <> 'pending' then raise exception 'This request has already been answered by the trainer'; end if;

  update public.shared_session_requests
  set trainer_status = normalized, trainer_responded_at = now()
  where id = trainer_decide_shared_session_request.request_id;

  if normalized = 'accepted' then
    insert into public.notifications(recipient_user_id, title, message, data) values
      (ssr.requester_user_id, 'Trainer approved shared session', 'The trainer approved your shared-session request. The other customer may still need to approve.', jsonb_build_object('shared_session_request_id', request_id)),
      (ssr.target_customer_user_id, 'Trainer approved shared session', 'The trainer approved a shared-session request for your session.', jsonb_build_object('shared_session_request_id', request_id));
    perform public._finalize_shared_session_request(request_id);
  else
    insert into public.notifications(recipient_user_id, title, message, data) values
      (ssr.requester_user_id, 'Shared session declined', 'The trainer declined your shared-session request.', jsonb_build_object('shared_session_request_id', request_id)),
      (ssr.target_customer_user_id, 'Shared session declined', 'The trainer declined the shared-session request.', jsonb_build_object('shared_session_request_id', request_id));
  end if;

  perform public.audit('trainer_decide_shared_session_request', 'shared_session_requests', request_id, jsonb_build_object('decision', decision));
end;
$$;

create or replace function public.get_my_shared_session_requests()
returns table(
  id uuid,
  source_session_id uuid,
  direction text,
  requester_name text,
  target_customer_name text,
  requester_status text,
  trainer_status text,
  start_at timestamptz,
  end_at timestamptz,
  session_title text,
  focus_area text,
  discount_percent numeric,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ssr.id,
    ssr.source_session_id,
    case when ssr.target_customer_user_id = auth.uid() then 'incoming' else 'outgoing' end as direction,
    requester.full_name as requester_name,
    target.full_name as target_customer_name,
    ssr.status::text as requester_status,
    ssr.trainer_status::text as trainer_status,
    s.start_at,
    s.end_at,
    coalesce(nullif(s.focus_area, ''), nullif(wp.title->>'en', ''), 'Training session') as session_title,
    coalesce(nullif(s.focus_area, ''), nullif(lower(wp.title->>'en'), ''), null) as focus_area,
    public.app_setting_number('shared_session_discount_percent', 40) as discount_percent,
    ssr.created_at
  from public.shared_session_requests ssr
  join public.sessions s on s.id = ssr.source_session_id
  left join public.workout_plans wp on wp.id = s.workout_plan_id
  left join public.profiles requester on requester.id = ssr.requester_user_id
  left join public.profiles target on target.id = ssr.target_customer_user_id
  where public.is_active_user()
    and (ssr.requester_user_id = auth.uid() or ssr.target_customer_user_id = auth.uid())
  order by ssr.created_at desc;
$$;

create or replace function public.get_admin_shared_session_requests()
returns table(
  id uuid,
  source_session_id uuid,
  requester_name text,
  target_customer_name text,
  requester_status text,
  trainer_status text,
  start_at timestamptz,
  end_at timestamptz,
  session_title text,
  focus_area text,
  discount_percent numeric,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return query
  select
    ssr.id,
    ssr.source_session_id,
    requester.full_name as requester_name,
    target.full_name as target_customer_name,
    ssr.status::text as requester_status,
    ssr.trainer_status::text as trainer_status,
    s.start_at,
    s.end_at,
    coalesce(nullif(s.focus_area, ''), nullif(wp.title->>'en', ''), 'Training session') as session_title,
    coalesce(nullif(s.focus_area, ''), nullif(lower(wp.title->>'en'), ''), null) as focus_area,
    public.app_setting_number('shared_session_discount_percent', 40) as discount_percent,
    ssr.created_at
  from public.shared_session_requests ssr
  join public.sessions s on s.id = ssr.source_session_id
  left join public.workout_plans wp on wp.id = s.workout_plan_id
  left join public.profiles requester on requester.id = ssr.requester_user_id
  left join public.profiles target on target.id = ssr.target_customer_user_id
  order by ssr.created_at desc;
end;
$$;
