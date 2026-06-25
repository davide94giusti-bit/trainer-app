import { createClient } from '@supabase/supabase-js';

export interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

type Body = { email: string; full_name: string; phone?: string; objective?: string; redirect_to?: string };

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const authHeader = context.request.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return Response.json({ error: 'Missing bearer token' }, { status: 401 });

  const body = (await context.request.json()) as Body;
  if (!body.email || !body.full_name) return Response.json({ error: 'email and full_name are required' }, { status: 400 });

  const userClient = createClient(context.env.VITE_SUPABASE_URL, context.env.VITE_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return Response.json({ error: 'Invalid token' }, { status: 401 });

  const service = createClient(context.env.VITE_SUPABASE_URL, context.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('role,status')
    .eq('id', userData.user.id)
    .single();
  if (profileError || profile?.role !== 'admin' || profile?.status !== 'active') {
    return Response.json({ error: 'Admin role required' }, { status: 403 });
  }

  const { data: invited, error: inviteError } = await service.auth.admin.inviteUserByEmail(body.email, {
    redirectTo: body.redirect_to ?? `${new URL(context.request.url).origin}/accept-invite`,
    data: { full_name: body.full_name },
  });
  if (inviteError) return Response.json({ error: inviteError.message }, { status: 400 });

  const userId = invited.user.id;
  const { error: profileUpsertError } = await service.from('profiles').upsert({
    id: userId,
    role: 'customer',
    status: 'invited',
    email: body.email.toLowerCase(),
    full_name: body.full_name,
    phone: body.phone ?? null,
    force_password_change: true,
  });
  if (profileUpsertError) return Response.json({ error: profileUpsertError.message }, { status: 500 });

  const { error: customerError } = await service.from('customer_profiles').upsert({
    user_id: userId,
    objective: body.objective ?? null,
  });
  if (customerError) return Response.json({ error: customerError.message }, { status: 500 });

  return Response.json({ id: userId, email: body.email, status: 'invited' });
};
