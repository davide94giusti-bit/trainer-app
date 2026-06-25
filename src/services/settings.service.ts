import { supabase } from '../lib/supabase';

export async function listSettings() {
  const { data, error } = await supabase.from('app_settings').select('*').order('key');
  if (error) throw error;
  return data ?? [];
}

export async function upsertSetting(key: string, value: any) {
  const { data, error } = await supabase.from('app_settings').upsert({ key, value }).select('*').single();
  if (error) throw error;
  return data;
}
