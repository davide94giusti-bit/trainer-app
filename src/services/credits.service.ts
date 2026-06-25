import { supabase } from '../lib/supabase';

export async function getMyCreditBalance(): Promise<number> {
  const { data, error } = await supabase.rpc('get_my_credit_balance');
  if (error) throw error;
  return Number(data ?? 0);
}

export async function getCustomerCreditBalance(customerUserId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_customer_credit_balance', { customer_user_id: customerUserId });
  if (error) throw error;
  return Number(data ?? 0);
}

export async function adjustCustomerCredits(customerUserId: string, quantity: number, reason: string) {
  const { error } = await supabase.rpc('adjust_customer_credits', { customer_user_id: customerUserId, quantity, reason });
  if (error) throw error;
}
