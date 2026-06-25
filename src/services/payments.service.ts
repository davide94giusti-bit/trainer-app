import { supabase } from '../lib/supabase';

export async function listPayments() {
  const { data, error } = await supabase.from('payments').select('*, packages(*)').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function markPaymentCompleted(paymentId: string) {
  const { error } = await supabase.rpc('mark_payment_completed', { payment_id: paymentId });
  if (error) throw error;
}

export async function markPaymentRejected(paymentId: string, reason: string) {
  const { error } = await supabase.rpc('mark_payment_rejected', { payment_id: paymentId, reason });
  if (error) throw error;
}
