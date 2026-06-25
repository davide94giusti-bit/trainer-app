import { supabase } from '../lib/supabase';
import type { Language, ThemePreference, UserStatus } from '../types/domain';
import { createAdminOrCustomerUser, deactivateUser, reactivateUser, resetUserOnboarding } from './adminUsers.service';

export async function listCustomers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, status, language, created_at, updated_at, customer_profiles(objective, target_weight_kg)')
    .eq('role', 'customer')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createCustomerProfile(input: {
  email: string;
  fullName?: string;
  full_name?: string;
  phone?: string;
  language?: Language;
  theme?: ThemePreference;
  objective?: string;
  notes?: string;
  status?: UserStatus;
  temporaryPassword?: string;
  sendInvite?: boolean;
  startingCredits?: number;
}) {
  return createAdminOrCustomerUser({
    role: 'customer',
    email: input.email,
    fullName: input.fullName ?? input.full_name ?? '',
    phone: input.phone,
    language: input.language,
    theme: input.theme,
    objective: input.objective,
    notes: input.notes,
    status: input.status,
    temporaryPassword: input.temporaryPassword,
    sendInvite: input.sendInvite,
    startingCredits: input.startingCredits,
  });
}

export async function deactivateCustomer(customerId: string) {
  await deactivateUser(customerId);
}

export async function reactivateCustomer(customerId: string) {
  await reactivateUser(customerId);
}

export async function resetCustomerOnboarding(customerId: string) {
  await resetUserOnboarding(customerId);
}
