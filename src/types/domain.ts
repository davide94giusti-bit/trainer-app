export type Role = 'admin' | 'customer';
export type UserStatus = 'invited' | 'active' | 'deactivated';
export type Language = 'en' | 'es' | 'it';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface Profile {
  id: string;
  role: Role;
  status: UserStatus;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  language: Language;
  theme: ThemePreference;
  force_password_change: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerProfile {
  user_id: string;
  objective: string | null;
  height_cm: number | null;
  target_weight_kg: number | null;
  injuries: string | null;
  emergency_contact: string | null;
}

export interface Exercise {
  id: string;
  name: Record<string, string>;
  description: Record<string, string> | null;
  category: string | null;
  muscles: string[] | null;
  equipment: string[] | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'active' | 'archived';
  created_at: string;
}

export interface SessionRow {
  id: string;
  trainer_user_id: string;
  customer_user_id: string | null;
  workout_plan_id: string | null;
  session_type: 'private' | 'shared';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  start_at: string;
  end_at: string;
  notes: string | null;
}

export interface AppSetting {
  key: string;
  value: any;
  updated_at: string;
}

export interface CreditBalance {
  balance: number;
}
