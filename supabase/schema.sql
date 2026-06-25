-- Trainer App Supabase schema
-- Run first in the Supabase SQL editor.

create extension if not exists pgcrypto;

-- Domain enums
create type public.user_role as enum ('admin', 'customer');
create type public.user_status as enum ('invited', 'active', 'deactivated');
create type public.language_code as enum ('en', 'es', 'it');
create type public.theme_preference as enum ('light', 'dark', 'system');
create type public.exercise_status as enum ('active', 'archived');
create type public.difficulty_level as enum ('beginner', 'intermediate', 'advanced');
create type public.media_type as enum ('image', 'gif', 'video');
create type public.workout_plan_status as enum ('draft', 'active', 'archived');
create type public.session_type as enum ('private', 'shared');
create type public.session_status as enum ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
create type public.participant_status as enum ('invited', 'accepted', 'declined', 'attended', 'no_show');
create type public.booking_request_status as enum ('pending', 'accepted', 'declined', 'proposed_alternative', 'cancelled', 'expired', 'conflicted');
create type public.cancellation_credit_action as enum ('none', 'consumed', 'manual_review');
create type public.shared_request_status as enum ('pending', 'accepted', 'declined', 'expired');
create type public.payment_method as enum ('bank_transfer', 'stripe', 'cash', 'other');
create type public.payment_status as enum ('pending', 'awaiting_confirmation', 'completed', 'rejected', 'failed');
create type public.payment_provider as enum ('manual', 'stripe');
create type public.credit_ledger_reason as enum ('payment_unlock', 'session_completed', 'late_cancel', 'admin_adjustment', 'refund', 'correction');
create type public.notification_status as enum ('unread', 'read');
create type public.notification_delivery_channel as enum ('in_app', 'email', 'push');
create type public.notification_delivery_status as enum ('pending', 'sent', 'failed', 'read');
create type public.availability_exception_type as enum ('unavailable', 'custom_available');
create type public.late_cancel_policy as enum ('consume_credit', 'do_not_consume', 'manual_review', 'warn_only');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'customer',
  status public.user_status not null default 'invited',
  full_name text,
  email text unique,
  phone text,
  language public.language_code not null default 'en',
  theme public.theme_preference not null default 'system',
  force_password_change boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create table public.trainer_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  business_name text,
  bio jsonb not null default '{}'::jsonb,
  default_session_minutes int not null default 60,
  timezone text not null default 'Europe/Zurich',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trainer_profiles_set_updated_at before update on public.trainer_profiles for each row execute function public.set_updated_at();

create table public.customer_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  objective text,
  height_cm numeric(5,2),
  target_weight_kg numeric(5,2),
  injuries text,
  emergency_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger customer_profiles_set_updated_at before update on public.customer_profiles for each row execute function public.set_updated_at();

create table public.customer_private_notes (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid not null references public.profiles(id) on delete cascade,
  note text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name jsonb not null,
  description jsonb not null default '{}'::jsonb,
  category text,
  muscles text[] not null default '{}',
  equipment text[] not null default '{}',
  difficulty public.difficulty_level not null default 'beginner',
  instructions jsonb not null default '{}'::jsonb,
  common_mistakes jsonb not null default '{}'::jsonb,
  safety_notes jsonb not null default '{}'::jsonb,
  status public.exercise_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger exercises_set_updated_at before update on public.exercises for each row execute function public.set_updated_at();

create table public.exercise_media (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  media_type public.media_type not null,
  url text not null,
  caption jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid references public.profiles(id) on delete set null,
  title jsonb not null,
  description jsonb not null default '{}'::jsonb,
  status public.workout_plan_status not null default 'draft',
  created_by uuid references public.profiles(id),
  assigned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger workout_plans_set_updated_at before update on public.workout_plans for each row execute function public.set_updated_at();

create table public.workout_plan_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid not null references public.workout_plans(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  sort_order int not null default 0,
  sets text,
  reps text,
  weight text,
  rest_seconds int,
  tempo text,
  duration_seconds int,
  rpe numeric(3,1),
  notes jsonb not null default '{}'::jsonb,
  progression_instructions jsonb not null default '{}'::jsonb
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  trainer_user_id uuid not null references public.profiles(id),
  customer_user_id uuid references public.profiles(id),
  workout_plan_id uuid references public.workout_plans(id),
  session_type public.session_type not null default 'private',
  status public.session_status not null default 'scheduled',
  start_at timestamptz not null,
  end_at timestamptz not null,
  notes text,
  credit_consumed boolean not null default false,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_valid_time check (start_at < end_at)
);
create trigger sessions_set_updated_at before update on public.sessions for each row execute function public.set_updated_at();
create index sessions_time_idx on public.sessions (start_at, end_at);

create table public.session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  customer_user_id uuid not null references public.profiles(id) on delete cascade,
  status public.participant_status not null default 'invited',
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(session_id, customer_user_id)
);

create table public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  sort_order int not null default 0,
  sets text,
  reps text,
  weight text,
  rest_seconds int,
  tempo text,
  duration_seconds int,
  rpe numeric(3,1),
  notes jsonb not null default '{}'::jsonb
);

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  trainer_user_id uuid not null references public.profiles(id),
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_minutes int not null default 60,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint availability_rules_valid_time check (start_time < end_time)
);

create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  trainer_user_id uuid not null references public.profiles(id),
  exception_type public.availability_exception_type not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint availability_exceptions_valid_time check (start_at < end_at)
);

create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid not null references public.profiles(id),
  trainer_user_id uuid references public.profiles(id),
  requested_start timestamptz not null,
  requested_end timestamptz not null,
  proposed_start timestamptz,
  proposed_end timestamptz,
  status public.booking_request_status not null default 'pending',
  notes text,
  admin_message text,
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_requests_valid_time check (requested_start < requested_end)
);
create trigger booking_requests_set_updated_at before update on public.booking_requests for each row execute function public.set_updated_at();

create table public.reschedule_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  customer_user_id uuid not null references public.profiles(id),
  requested_start timestamptz not null,
  requested_end timestamptz not null,
  reason text,
  status public.booking_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reschedule_requests_valid_time check (requested_start < requested_end)
);
create trigger reschedule_requests_set_updated_at before update on public.reschedule_requests for each row execute function public.set_updated_at();

create table public.cancellation_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id),
  actor_user_id uuid not null references public.profiles(id),
  cancelled_hours_before numeric(8,2),
  credit_action public.cancellation_credit_action not null default 'none',
  policy_snapshot jsonb not null default '{}'::jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create table public.shared_session_requests (
  id uuid primary key default gen_random_uuid(),
  source_session_id uuid not null references public.sessions(id) on delete cascade,
  requester_user_id uuid not null references public.profiles(id),
  target_customer_user_id uuid not null references public.profiles(id),
  status public.shared_request_status not null default 'pending',
  trainer_status public.shared_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger shared_session_requests_set_updated_at before update on public.shared_session_requests for each row execute function public.set_updated_at();

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  name jsonb not null,
  description jsonb not null default '{}'::jsonb,
  credit_quantity numeric(10,2) not null check (credit_quantity > 0),
  price numeric(10,2) not null check (price >= 0),
  currency text not null default 'EUR',
  status public.exercise_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger packages_set_updated_at before update on public.packages for each row execute function public.set_updated_at();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid not null references public.profiles(id),
  package_id uuid references public.packages(id),
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'EUR',
  method public.payment_method not null default 'bank_transfer',
  provider public.payment_provider not null default 'manual',
  status public.payment_status not null default 'pending',
  provider_reference text,
  admin_notes text,
  rejection_reason text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger payments_set_updated_at before update on public.payments for each row execute function public.set_updated_at();

create table public.session_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid not null references public.profiles(id),
  quantity numeric(10,2) not null,
  reason public.credit_ledger_reason not null,
  session_id uuid references public.sessions(id),
  payment_id uuid references public.payments(id),
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index session_credit_ledger_customer_idx on public.session_credit_ledger(customer_user_id, created_at desc);

create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid not null references public.profiles(id),
  measured_at date not null default current_date,
  weight_kg numeric(5,2),
  body_fat_percent numeric(5,2),
  chest_cm numeric(5,2),
  waist_cm numeric(5,2),
  hips_cm numeric(5,2),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  status public.notification_status not null default 'unread',
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  channel public.notification_delivery_channel not null,
  status public.notification_delivery_status not null default 'pending',
  provider_reference text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id),
  action text not null,
  entity_table text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Helpful views: customer-safe profile data excludes customer_private_notes.
create or replace view public.customer_profiles_public as
select p.id, p.full_name, p.email, p.phone, p.language, cp.objective, cp.height_cm, cp.target_weight_kg
from public.profiles p
join public.customer_profiles cp on cp.user_id = p.id
where p.role = 'customer';

comment on table public.customer_private_notes is 'Admin-only customer notes. This prevents customers from reading internal trainer notes through column-level leakage.';
