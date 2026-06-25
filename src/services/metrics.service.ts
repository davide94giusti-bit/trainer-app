import { supabase } from '../lib/supabase';

export async function listBodyMetrics() {
  const { data, error } = await supabase.from('body_metrics').select('*').order('measured_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createBodyMetric(input: any) {
  const { data, error } = await supabase.from('body_metrics').insert(input).select('*').single();
  if (error) throw error;
  return data;
}
