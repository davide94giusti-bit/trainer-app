import { supabase } from '../lib/supabase';

export async function listExercises() {
  const { data, error } = await supabase.from('exercises').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createExercise(input: any) {
  const { data, error } = await supabase.from('exercises').insert(input).select('*').single();
  if (error) throw error;
  return data;
}

export async function archiveExercise(exerciseId: string) {
  const { error } = await supabase.rpc('archive_exercise', { exercise_id: exerciseId });
  if (error) throw error;
}
