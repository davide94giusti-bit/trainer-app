import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.DEMO_ADMIN_EMAIL ?? 'admin@example.com';
const adminPassword = process.env.DEMO_ADMIN_PASSWORD ?? 'ChangeMe123!';
const customerPassword = process.env.DEMO_CUSTOMER_PASSWORD ?? 'ChangeMe123!';

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your local environment. Never expose the service role key to the browser.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function createUser(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error && !error.message.toLowerCase().includes('already')) throw error;
  if (data.user) return data.user.id;

  const { data: list, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;
  const existing = list.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) throw new Error(`Could not find or create ${email}`);
  return existing.id;
}

async function upsertProfile(id: string, role: 'admin' | 'customer', email: string, fullName: string) {
  const { error } = await supabase.from('profiles').upsert({
    id,
    role,
    status: 'active',
    full_name: fullName,
    email,
    language: 'en',
    theme: 'system',
  });
  if (error) throw error;
  if (role === 'admin') {
    await supabase.from('trainer_profiles').upsert({ user_id: id, business_name: 'Eddy Personal Training' });
  } else {
    await supabase.from('customer_profiles').upsert({ user_id: id, objective: 'Improve strength and body composition' });
  }
}

async function main() {
  const adminId = await createUser(adminEmail, adminPassword, 'Demo Admin');
  await upsertProfile(adminId, 'admin', adminEmail, 'Demo Admin');

  for (const [email, name] of [
    ['customer1@example.com', 'Demo Customer One'],
    ['customer2@example.com', 'Demo Customer Two'],
    ['customer3@example.com', 'Demo Customer Three'],
  ] as const) {
    const id = await createUser(email, customerPassword, name);
    await upsertProfile(id, 'customer', email, name);
  }

  console.log('Demo users created/updated. Run supabase/seed.sql again to attach demo payments, metrics, plans, and credits.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
