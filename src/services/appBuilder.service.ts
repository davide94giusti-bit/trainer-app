import { supabase } from '../lib/supabase';
import type { Language, ThemePreference } from '../types/domain';

export type LocalizedText = Record<Language, string>;

export type BrandingSettings = {
  app_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  default_theme: ThemePreference;
  login_title: LocalizedText;
  login_subtitle: LocalizedText;
  support_email: string;
  business_name: string;
  trainer_display_name: string;
};

export type DashboardWidget = { key: string; label: string; enabled: boolean; sort_order: number };
export type NavigationItem = { key: string; label: string; route: string; enabled: boolean; sort_order: number };
export type FeatureFlag = { key: string; label: string; enabled: boolean };
export type PolicySetting = { key: string; label: string; value: string | number | boolean };
export type ContentBlock = { key: string; label: string; localized_value: LocalizedText; enabled: boolean };

const fallbackLocalized = (en: string): LocalizedText => ({ en, es: en, it: en });

export const defaultBranding: BrandingSettings = {
  app_name: 'Trainer App',
  logo_url: '',
  primary_color: '#1976d2',
  secondary_color: '#9c27b0',
  accent_color: '#ed6c02',
  default_theme: 'system',
  login_title: fallbackLocalized('Welcome back'),
  login_subtitle: fallbackLocalized('Log in to manage your training.'),
  support_email: '',
  business_name: '',
  trainer_display_name: '',
};

export async function getBrandingSettings(): Promise<BrandingSettings> {
  const { data, error } = await supabase.from('app_branding_settings').select('*').eq('id', 'default').maybeSingle();
  if (error) throw error;
  return data ? { ...defaultBranding, ...data } as BrandingSettings : defaultBranding;
}

export async function updateBrandingSettings(input: BrandingSettings) {
  const { data, error } = await supabase.rpc('update_app_branding', { payload: input });
  if (error) throw error;
  return data;
}

export async function listDashboardWidgets(): Promise<DashboardWidget[]> {
  const { data, error } = await supabase.from('app_dashboard_widgets').select('key,label,enabled,sort_order').order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function saveDashboardWidgets(widgets: DashboardWidget[]) {
  const { data, error } = await supabase.rpc('update_dashboard_widgets', { payload: widgets });
  if (error) throw error;
  return data;
}

export async function listContentBlocks(): Promise<ContentBlock[]> {
  const { data, error } = await supabase.from('app_content_blocks').select('key,label,localized_value,enabled').order('key');
  if (error) throw error;
  return data ?? [];
}

export async function saveContentBlock(block: ContentBlock) {
  const { data, error } = await supabase.rpc('update_content_block', { block_key: block.key, payload: block });
  if (error) throw error;
  return data;
}

export async function listNavigationItems(): Promise<NavigationItem[]> {
  const { data, error } = await supabase.from('app_navigation_items').select('key,label,route,enabled,sort_order').order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function saveNavigationItems(items: NavigationItem[]) {
  const { data, error } = await supabase.rpc('update_navigation_items', { payload: items });
  if (error) throw error;
  return data;
}

export async function listFeatureFlags(): Promise<FeatureFlag[]> {
  const { data, error } = await supabase.from('app_feature_flags').select('key,label,enabled').order('key');
  if (error) throw error;
  return data ?? [];
}

export async function saveFeatureFlag(flag: FeatureFlag) {
  const { data, error } = await supabase.rpc('update_feature_flag', { flag_key: flag.key, is_enabled: flag.enabled });
  if (error) throw error;
  return data;
}

export async function listPolicySettings(): Promise<PolicySetting[]> {
  const { data, error } = await supabase.from('app_policy_settings').select('key,label,value').order('key');
  if (error) throw error;
  return data ?? [];
}

export async function savePolicySetting(setting: PolicySetting) {
  const { data, error } = await supabase.rpc('update_policy_setting', { setting_key: setting.key, setting_value: setting.value });
  if (error) throw error;
  return data;
}

export async function getLanguageSettings() {
  const { data, error } = await supabase.from('app_settings').select('key,value').in('key', ['default_language', 'enabled_languages']);
  if (error) throw error;
  const map = Object.fromEntries((data ?? []).map(row => [row.key, row.value]));
  return { default_language: (map.default_language ?? 'en') as Language, enabled_languages: (map.enabled_languages ?? ['en', 'es', 'it']) as Language[] };
}

export async function saveLanguageSettings(input: { default_language: Language; enabled_languages: Language[] }) {
  const { data, error } = await supabase.rpc('update_language_settings', { payload: input });
  if (error) throw error;
  return data;
}
