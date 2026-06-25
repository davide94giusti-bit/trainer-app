import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { z } from 'zod';

export interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

const bodySchema = z.object({
  role: z.enum(['admin', 'customer']),
  email: z.string().email(),
  fullName: z.string().min(1),
  phone: z.string().optional().default(''),
  language: z.enum(['en', 'es', 'it']).optional().default('en'),
  theme: z.enum(['light', 'dark', 'system']).optional().default('system'),
  temporaryPassword: z.string().min(8).optional().or(z.literal('')),
  sendInvite: z.boolean().optional().default(true),
  status: z.enum(['invited', 'active', 'deactivated']).optional(),
  objective: z.string().optional(),
  notes: z.string().optional(),
  startingCredits: z.coerce.number().min(0).optional().default(0),
});

type CreateUserBody = z.infer<typeof bodySchema>;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(payload: unknown, init?: ResponseInit) {
  return Response.json(payload, { ...init, headers: { ...corsHeaders, ...(init?.headers ?? {}) } });
}

async function findAuthUserByEmail(service: SupabaseClient, email: string): Promise<User | null> {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find(user => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 1000) return null;
  }
  return null;
}

async function requireActiveAdmin(context: EventContext<Env, string, unknown>, bearerToken: string) {
  const userClient = createClient(context.env.VITE_SUPABASE_URL, context.env.VITE_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${bearerToken}` } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(bearerToken);
  if (userError || !userData.user) throw new Response('Invalid token', { status: 401 });

  const service = createClient(context.env.VITE_SUPABASE_URL, context.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { data: callerProfile, error: profileError } = await service
    .from('profiles')
    .select('id,role,status,email')
    .eq('id', userData.user.id)
    .single();

  if (profileError || callerProfile?.role !== 'admin' || callerProfile?.status !== 'active') {
    throw new Response('Admin role required', { status: 403 });
  }

  return { service, caller: userData.user, callerProfile };
}

export const onRequestOptions: PagesFunction<Env> = async () => new Response(null, { headers: corsHeaders });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    if (!context.env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY server secret' }, { status: 500 });

    const authHeader = context.request.headers.get('authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'Missing bearer token' }, { status: 401 });

    const parsed = bodySchema.safeParse(await context.request.json());
    if (!parsed.success) return json({ error: parsed.error.issues.map(issue => issue.message).join(', ') }, { status: 400 });
    const body: CreateUserBody = parsed.data;
    const email = body.email.toLowerCase().trim();
    const { service, caller } = await requireActiveAdmin(context, token);

    let authUser = await findAuthUserByEmail(service, email);
    const redirectTo = `${new URL(context.request.url).origin}/accept-invite`;

    if (!authUser) {
      if (body.sendInvite) {
        const { data, error } = await service.auth.admin.inviteUserByEmail(email, {
          redirectTo,
          data: { full_name: body.fullName, role: body.role },
        });
        if (error) return json({ error: error.message }, { status: 400 });
        authUser = data.user;
      } else {
        if (!body.temporaryPassword) return json({ error: 'temporaryPassword is required when sendInvite is false' }, { status: 400 });
        const { data, error } = await service.auth.admin.createUser({
          email,
          password: body.temporaryPassword,
          email_confirm: true,
          user_metadata: { full_name: body.fullName, role: body.role },
        });
        if (error) return json({ error: error.message }, { status: 400 });
        authUser = data.user;
      }
    } else {
      const { error } = await service.auth.admin.updateUserById(authUser.id, {
        user_metadata: { ...(authUser.user_metadata ?? {}), full_name: body.fullName, role: body.role },
      });
      if (error) return json({ error: error.message }, { status: 400 });
    }

    const status = body.status ?? (body.sendInvite ? 'invited' : 'active');
    const { data: profile, error: profileError } = await service.from('profiles').upsert({
      id: authUser.id,
      role: body.role,
      status,
      email,
      full_name: body.fullName,
      phone: body.phone || null,
      language: body.language,
      theme: body.theme,
      force_password_change: !body.sendInvite,
    }).select('id,role,status,email,full_name,phone,language,theme,created_at,updated_at').single();
    if (profileError) return json({ error: profileError.message }, { status: 500 });

    if (body.role === 'customer') {
      const { error: customerError } = await service.from('customer_profiles').upsert({
        user_id: authUser.id,
        objective: body.objective ?? null,
      });
      if (customerError) return json({ error: customerError.message }, { status: 500 });

      if (body.notes?.trim()) {
        const { error: noteError } = await service.from('customer_private_notes').insert({
          customer_user_id: authUser.id,
          note: body.notes.trim(),
          created_by: caller.id,
        });
        if (noteError) return json({ error: noteError.message }, { status: 500 });
      }

      if (body.startingCredits > 0) {
        const { error: creditError } = await service.from('session_credit_ledger').insert({
          customer_user_id: authUser.id,
          quantity: body.startingCredits,
          reason: 'admin_adjustment',
          note: 'Starting credits assigned during onboarding',
          created_by: caller.id,
        });
        if (creditError) return json({ error: creditError.message }, { status: 500 });
      }

      await service.from('notifications').insert({
        recipient_user_id: authUser.id,
        title: 'Welcome',
        message: 'Your trainer app profile is ready.',
        data: { source: 'admin_create_user' },
      });
    }

    if (body.role === 'admin') {
      await service.from('trainer_profiles').upsert({ user_id: authUser.id });
    }

    await service.from('audit_logs').insert({
      actor_user_id: caller.id,
      action: body.role === 'admin' ? 'create_admin_user' : 'create_customer_user',
      entity_table: 'profiles',
      entity_id: authUser.id,
      metadata: { email, role: body.role, status, sendInvite: body.sendInvite, startingCredits: body.startingCredits },
    });

    return json({ profile, authUser: { id: authUser.id, email: authUser.email }, reusedAuthUser: !!authUser.last_sign_in_at });
  } catch (error) {
    if (error instanceof Response) return json({ error: await error.text() }, { status: error.status });
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
};
