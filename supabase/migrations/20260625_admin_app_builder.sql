
-- 2026 admin console and customer app builder extension
create table if not exists public.app_branding_settings (
  id text primary key default 'default' check (id = 'default'),
  app_name text not null default 'Trainer App',
  logo_url text,
  primary_color text not null default '#1976d2',
  secondary_color text not null default '#9c27b0',
  accent_color text not null default '#ed6c02',
  default_theme public.theme_preference not null default 'system',
  login_title jsonb not null default '{"en":"Welcome back","es":"Bienvenido de nuevo","it":"Bentornato"}'::jsonb,
  login_subtitle jsonb not null default '{"en":"Log in to manage your training.","es":"Inicia sesión para gestionar tu entrenamiento.","it":"Accedi per gestire il tuo allenamento."}'::jsonb,
  support_email text,
  business_name text,
  trainer_display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);
drop trigger if exists app_branding_settings_set_updated_at on public.app_branding_settings;
create trigger app_branding_settings_set_updated_at before update on public.app_branding_settings for each row execute function public.set_updated_at();

create table if not exists public.app_content_blocks (
  key text primary key,
  label text not null,
  localized_value jsonb not null default '{"en":"","es":"","it":""}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id),
  constraint app_content_blocks_languages check (localized_value ? 'en' and localized_value ? 'es' and localized_value ? 'it')
);
drop trigger if exists app_content_blocks_set_updated_at on public.app_content_blocks;
create trigger app_content_blocks_set_updated_at before update on public.app_content_blocks for each row execute function public.set_updated_at();

create table if not exists public.app_dashboard_widgets (
  key text primary key,
  label text not null,
  enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);
drop trigger if exists app_dashboard_widgets_set_updated_at on public.app_dashboard_widgets;
create trigger app_dashboard_widgets_set_updated_at before update on public.app_dashboard_widgets for each row execute function public.set_updated_at();

create table if not exists public.app_navigation_items (
  key text primary key,
  label text not null,
  route text not null,
  enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id),
  constraint app_navigation_items_no_admin_routes check (route not like '/admin%')
);
drop trigger if exists app_navigation_items_set_updated_at on public.app_navigation_items;
create trigger app_navigation_items_set_updated_at before update on public.app_navigation_items for each row execute function public.set_updated_at();

create table if not exists public.app_feature_flags (
  key text primary key,
  label text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);
drop trigger if exists app_feature_flags_set_updated_at on public.app_feature_flags;
create trigger app_feature_flags_set_updated_at before update on public.app_feature_flags for each row execute function public.set_updated_at();

create table if not exists public.app_policy_settings (
  key text primary key,
  label text not null,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);
drop trigger if exists app_policy_settings_set_updated_at on public.app_policy_settings;
create trigger app_policy_settings_set_updated_at before update on public.app_policy_settings for each row execute function public.set_updated_at();

-- 2026 admin/user management and app builder RPCs
create or replace function public.create_admin_profile(user_id uuid, email text, full_name text, phone text default null, language text default 'en', theme text default 'system', status text default 'invited')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  insert into public.profiles(id, role, status, full_name, email, phone, language, theme, force_password_change)
  values (user_id, 'admin', status::public.user_status, full_name, lower(email), phone, language::public.language_code, theme::public.theme_preference, true)
  on conflict (id) do update set role = 'admin', status = excluded.status, full_name = excluded.full_name, email = excluded.email, phone = excluded.phone, language = excluded.language, theme = excluded.theme;
  insert into public.trainer_profiles(user_id) values (user_id) on conflict (user_id) do nothing;
  perform public.audit('create_admin_profile', 'profiles', user_id, jsonb_build_object('email', email));
  return user_id;
end;
$$;

create or replace function public.create_customer_profile(user_id uuid, email text, full_name text, phone text default null, objective text default null, language text default 'en', theme text default 'system', status text default 'invited')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  insert into public.profiles(id, role, status, full_name, email, phone, language, theme, force_password_change)
  values (user_id, 'customer', status::public.user_status, full_name, lower(email), phone, language::public.language_code, theme::public.theme_preference, true)
  on conflict (id) do update set role = 'customer', status = excluded.status, full_name = excluded.full_name, email = excluded.email, phone = excluded.phone, language = excluded.language, theme = excluded.theme;
  insert into public.customer_profiles(user_id, objective)
  values (user_id, objective)
  on conflict (user_id) do update set objective = excluded.objective;
  perform public.audit('create_customer_profile', 'profiles', user_id, jsonb_build_object('email', email));
  return user_id;
end;
$$;

create or replace function public.deactivate_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  update public.profiles set status = 'deactivated' where id = target_user_id;
  perform public.audit('deactivate_user', 'profiles', target_user_id);
end;
$$;

create or replace function public.reactivate_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  update public.profiles set status = 'active' where id = target_user_id;
  perform public.audit('reactivate_user', 'profiles', target_user_id);
end;
$$;

create or replace function public.reset_user_onboarding(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  update public.profiles set status = 'invited', force_password_change = true where id = target_user_id;
  perform public.audit('reset_user_onboarding', 'profiles', target_user_id);
end;
$$;

create or replace function public.set_user_role(target_user_id uuid, next_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  update public.profiles set role = next_role::public.user_role where id = target_user_id;
  if next_role = 'admin' then
    insert into public.trainer_profiles(user_id) values (target_user_id) on conflict (user_id) do nothing;
  elsif next_role = 'customer' then
    insert into public.customer_profiles(user_id) values (target_user_id) on conflict (user_id) do nothing;
  end if;
  perform public.audit('set_user_role', 'profiles', target_user_id, jsonb_build_object('role', next_role));
end;
$$;

create or replace function public.update_app_branding(payload jsonb)
returns public.app_branding_settings
language plpgsql
security definer
set search_path = public
as $$
declare result public.app_branding_settings;
begin
  perform public.assert_admin();
  insert into public.app_branding_settings(id, app_name, logo_url, primary_color, secondary_color, accent_color, default_theme, login_title, login_subtitle, support_email, business_name, trainer_display_name, updated_by)
  values ('default', coalesce(payload->>'app_name', 'Trainer App'), payload->>'logo_url', coalesce(payload->>'primary_color', '#1976d2'), coalesce(payload->>'secondary_color', '#9c27b0'), coalesce(payload->>'accent_color', '#ed6c02'), coalesce(payload->>'default_theme', 'system')::public.theme_preference, coalesce(payload->'login_title', '{"en":"Welcome back","es":"Bienvenido de nuevo","it":"Bentornato"}'::jsonb), coalesce(payload->'login_subtitle', '{"en":"Log in to manage your training.","es":"Inicia sesión para gestionar tu entrenamiento.","it":"Accedi per gestire il tuo allenamento."}'::jsonb), payload->>'support_email', payload->>'business_name', payload->>'trainer_display_name', auth.uid())
  on conflict (id) do update set app_name = excluded.app_name, logo_url = excluded.logo_url, primary_color = excluded.primary_color, secondary_color = excluded.secondary_color, accent_color = excluded.accent_color, default_theme = excluded.default_theme, login_title = excluded.login_title, login_subtitle = excluded.login_subtitle, support_email = excluded.support_email, business_name = excluded.business_name, trainer_display_name = excluded.trainer_display_name, updated_by = auth.uid()
  returning * into result;
  perform public.audit('update_app_branding', 'app_branding_settings', null, payload);
  return result;
end;
$$;

create or replace function public.update_dashboard_widgets(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare item jsonb;
begin
  perform public.assert_admin();
  for item in select * from jsonb_array_elements(payload) loop
    insert into public.app_dashboard_widgets(key, label, enabled, sort_order, updated_by)
    values (item->>'key', item->>'label', coalesce((item->>'enabled')::boolean, true), coalesce((item->>'sort_order')::int, 0), auth.uid())
    on conflict (key) do update set label = excluded.label, enabled = excluded.enabled, sort_order = excluded.sort_order, updated_by = auth.uid();
  end loop;
  perform public.audit('update_dashboard_widgets', 'app_dashboard_widgets', null, payload);
end;
$$;

create or replace function public.update_navigation_items(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare item jsonb;
begin
  perform public.assert_admin();
  for item in select * from jsonb_array_elements(payload) loop
    if (item->>'route') like '/admin%' then
      raise exception 'Customer navigation cannot expose admin routes' using errcode = '42501';
    end if;
    insert into public.app_navigation_items(key, label, route, enabled, sort_order, updated_by)
    values (item->>'key', item->>'label', item->>'route', coalesce((item->>'enabled')::boolean, true), coalesce((item->>'sort_order')::int, 0), auth.uid())
    on conflict (key) do update set label = excluded.label, route = excluded.route, enabled = excluded.enabled, sort_order = excluded.sort_order, updated_by = auth.uid();
  end loop;
  perform public.audit('update_navigation_items', 'app_navigation_items', null, payload);
end;
$$;

create or replace function public.update_content_block(block_key text, payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  insert into public.app_content_blocks(key, label, localized_value, enabled, updated_by)
  values (block_key, coalesce(payload->>'label', block_key), coalesce(payload->'localized_value', '{"en":"","es":"","it":""}'::jsonb), coalesce((payload->>'enabled')::boolean, true), auth.uid())
  on conflict (key) do update set label = excluded.label, localized_value = excluded.localized_value, enabled = excluded.enabled, updated_by = auth.uid();
  perform public.audit('update_content_block', 'app_content_blocks', null, jsonb_build_object('key', block_key));
end;
$$;

create or replace function public.update_feature_flag(flag_key text, is_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  update public.app_feature_flags set enabled = is_enabled, updated_by = auth.uid() where key = flag_key;
  perform public.audit('update_feature_flag', 'app_feature_flags', null, jsonb_build_object('key', flag_key, 'enabled', is_enabled));
end;
$$;

create or replace function public.update_policy_setting(setting_key text, setting_value jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  insert into public.app_policy_settings(key, label, value, updated_by)
  values (setting_key, initcap(replace(setting_key, '_', ' ')), setting_value, auth.uid())
  on conflict (key) do update set value = excluded.value, updated_by = auth.uid();
  insert into public.app_settings(key, value, updated_by)
  values (setting_key, setting_value, auth.uid())
  on conflict (key) do update set value = excluded.value, updated_by = auth.uid(), updated_at = now();
  perform public.audit('update_policy_setting', 'app_policy_settings', null, jsonb_build_object('key', setting_key, 'value', setting_value));
end;
$$;

create or replace function public.update_language_settings(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  if not (payload ? 'default_language') or not (payload ? 'enabled_languages') then
    raise exception 'default_language and enabled_languages are required';
  end if;
  insert into public.app_settings(key, value, updated_by) values ('default_language', to_jsonb(payload->>'default_language'), auth.uid()) on conflict (key) do update set value = excluded.value, updated_by = auth.uid(), updated_at = now();
  insert into public.app_settings(key, value, updated_by) values ('enabled_languages', payload->'enabled_languages', auth.uid()) on conflict (key) do update set value = excluded.value, updated_by = auth.uid(), updated_at = now();
  perform public.audit('update_language_settings', 'app_settings', null, payload);
end;
$$;

-- 2026 app builder RLS
alter table public.app_branding_settings enable row level security;
alter table public.app_content_blocks enable row level security;
alter table public.app_dashboard_widgets enable row level security;
alter table public.app_navigation_items enable row level security;
alter table public.app_feature_flags enable row level security;
alter table public.app_policy_settings enable row level security;

drop policy if exists app_branding_active_read on public.app_branding_settings;
create policy app_branding_active_read on public.app_branding_settings for select using (public.is_active_user());
drop policy if exists app_branding_admin_write on public.app_branding_settings;
create policy app_branding_admin_write on public.app_branding_settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists app_content_read_enabled_or_admin on public.app_content_blocks;
create policy app_content_read_enabled_or_admin on public.app_content_blocks for select using (public.is_admin() or (enabled and public.is_active_user()));
drop policy if exists app_content_admin_write on public.app_content_blocks;
create policy app_content_admin_write on public.app_content_blocks for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists app_widgets_read_enabled_or_admin on public.app_dashboard_widgets;
create policy app_widgets_read_enabled_or_admin on public.app_dashboard_widgets for select using (public.is_admin() or (enabled and public.is_active_user()));
drop policy if exists app_widgets_admin_write on public.app_dashboard_widgets;
create policy app_widgets_admin_write on public.app_dashboard_widgets for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists app_navigation_read_enabled_or_admin on public.app_navigation_items;
create policy app_navigation_read_enabled_or_admin on public.app_navigation_items for select using (public.is_admin() or (enabled and public.is_active_user() and route not like '/admin%'));
drop policy if exists app_navigation_admin_write on public.app_navigation_items;
create policy app_navigation_admin_write on public.app_navigation_items for all using (public.is_admin()) with check (public.is_admin() and route not like '/admin%');

drop policy if exists app_feature_flags_read_enabled_or_admin on public.app_feature_flags;
create policy app_feature_flags_read_enabled_or_admin on public.app_feature_flags for select using (public.is_admin() or (enabled and public.is_active_user()));
drop policy if exists app_feature_flags_admin_write on public.app_feature_flags;
create policy app_feature_flags_admin_write on public.app_feature_flags for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists app_policy_settings_read_active on public.app_policy_settings;
create policy app_policy_settings_read_active on public.app_policy_settings for select using (public.is_active_user());
drop policy if exists app_policy_settings_admin_write on public.app_policy_settings;
create policy app_policy_settings_admin_write on public.app_policy_settings for all using (public.is_admin()) with check (public.is_admin());

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
('shared_session_requests', 'Shared session requests', false),
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
