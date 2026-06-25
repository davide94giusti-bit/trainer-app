import { supabase } from '../lib/supabase';

export async function listCustomers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, status, language, created_at, customer_profiles(objective, target_weight_kg)')
    .eq('role', 'customer')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createCustomerProfile(input: { email: string; full_name: string; phone?: string; objective?: string }) {
  const { data, error } = await supabase.rpc('create_customer_profile', input);
  if (error) throw error;
  return data;
}

export async function deactivateCustomer(customerId: string) {
  const { error } = await supabase.rpc('deactivate_customer', { customer_id: customerId });
  if (error) throw error;
}

export async function reactivateCustomer(customerId: string) {
  const { error } = await supabase.rpc('reactivate_customer', { customer_id: customerId });
  if (error) throw error;
}
