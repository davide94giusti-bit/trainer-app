import { supabase } from '../lib/supabase';
import type { Language, Role, ThemePreference, UserStatus } from '../types/domain';

export type CreateUserInput = {
  role: Role;
  email: string;
  fullName: string;
  phone?: string;
  language?: Language;
  theme?: ThemePreference;
  temporaryPassword?: string;
  sendInvite?: boolean;
  objective?: string;
  notes?: string;
  startingCredits?: number;
  status?: UserStatus;
};

export async function createAdminOrCustomerUser(input: CreateUserInput) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const response = await fetch('/api/admin/create-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    [key: string]: unknown;
  };

  if (!response.ok) throw new Error(payload.error ?? 'User creation failed');
  return payload;
}

export async function listAdminUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, status, language, theme, created_at, updated_at')
    .eq('role', 'admin')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProfileById(id: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function deactivateUser(userId: string) {
  const { error } = await supabase.rpc('deactivate_user', { target_user_id: userId });
  if (error) throw error;
}

export async function reactivateUser(userId: string) {
  const { error } = await supabase.rpc('reactivate_user', { target_user_id: userId });
  if (error) throw error;
}

export async function resetUserOnboarding(userId: string) {
  const { error } = await supabase.rpc('reset_user_onboarding', { target_user_id: userId });
  if (error) throw error;
}

export async function updateSafeProfile(userId: string, input: { full_name?: string; phone?: string; language?: Language; theme?: ThemePreference }) {
  const { data, error } = await supabase.from('profiles').update(input).eq('id', userId).select('*').single();
  if (error) throw error;
  return data;
}
