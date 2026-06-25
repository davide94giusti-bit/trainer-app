import { supabase } from '../lib/supabase';

export async function listSessions() {
  const { data, error } = await supabase.from('sessions').select('*, session_participants(*)').order('start_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getSession(id: string) {
  const { data, error } = await supabase.from('sessions').select('*, session_exercises(*, exercises(*)), session_participants(*)').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createManualSession(input: { customer_user_id: string; start_at: string; end_at: string; workout_plan_id?: string; notes?: string }) {
  const { data, error } = await supabase.rpc('create_manual_session', input);
  if (error) throw error;
  return data;
}

export async function completeSession(sessionId: string) {
  const { error } = await supabase.rpc('complete_session', { session_id: sessionId });
  if (error) throw error;
}

export async function cancelSession(sessionId: string, reason: string) {
  const { error } = await supabase.rpc('cancel_session', { session_id: sessionId, reason });
  if (error) throw error;
}


export async function listMyUpcomingSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('id,start_at,end_at,status,session_type,focus_area,notes')
    .gte('start_at', new Date().toISOString())
    .in('status', ['scheduled', 'confirmed'])
    .order('start_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
