import { supabase } from '../lib/supabase';

export async function listWorkoutPlans() {
  const { data, error } = await supabase.from('workout_plans').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMyActiveWorkoutPlan() {
  const { data, error } = await supabase
    .from('workout_plans')
    .select('*, workout_plan_exercises(*, exercises(*))')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function assignWorkoutPlan(planId: string, customerUserId: string) {
  const { error } = await supabase.rpc('assign_workout_plan', { plan_id: planId, customer_user_id: customerUserId });
  if (error) throw error;
}
