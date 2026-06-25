import { supabase } from '../lib/supabase';
import type { Profile, Language, ThemePreference } from '../types/domain';

export async function getMyProfile(): Promise<Profile | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userData.user.id).single();
  if (error) throw error;
  return data as Profile;
}

export async function updateMyProfile(input: { full_name?: string; phone?: string; language?: Language; theme?: ThemePreference }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Not authenticated');
  const { data, error } = await supabase.from('profiles').update(input).eq('id', userData.user.id).select('*').single();
  if (error) throw error;
  return data as Profile;
}

export async function listProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Profile[];
}
