import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Vite still renders the app so the setup screen can explain missing env values.
  // Supabase calls will fail until these are configured.
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl ?? 'https://missing.supabase.co', supabaseAnonKey ?? 'missing', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
