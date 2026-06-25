import { Alert, Button, Card, CardContent, Grid, MenuItem, Stack, TextField } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import AdminPageHeader from '../../../components/admin/AdminPageHeader';
import AppBuilderTabs from '../../../components/admin/AppBuilderTabs';
import LocalizedJsonEditor from '../../../components/admin/LocalizedJsonEditor';
import LoadingScreen from '../../../components/LoadingScreen';
import { getBrandingSettings, updateBrandingSettings, defaultBranding, type BrandingSettings } from '../../../services/appBuilder.service';
import { queryClient } from '../../../lib/queryClient';
import { useI18n } from '../../../lib/i18n';
import type { ThemePreference } from '../../../types/domain';

export default function BrandingSettingsPage() {
  const { t } = useI18n();
  const query = useQuery({ queryKey: ['app-branding'], queryFn: getBrandingSettings });
  const [form, setForm] = useState<BrandingSettings>(defaultBranding);
  useEffect(() => { if (query.data) setForm(query.data); }, [query.data]);
  const mutation = useMutation({ mutationFn: () => updateBrandingSettings(form), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-branding'] }) });
  if (query.isLoading) return <LoadingScreen />;
  return <Stack spacing={2}><AdminPageHeader title={t('appBuilder.branding.title')} /><AppBuilderTabs />{query.error && <Alert severity="error">{(query.error as Error).message}</Alert>}{mutation.error && <Alert severity="error">{(mutation.error as Error).message}</Alert>}{mutation.isSuccess && <Alert severity="success">{t('appBuilder.updated')}</Alert>}<Card><CardContent><Stack spacing={2}><Grid container spacing={2}><Grid item xs={12} md={6}><TextField fullWidth label={t('appBuilder.appName')} value={form.app_name} onChange={e => setForm({ ...form, app_name: e.target.value })} /></Grid><Grid item xs={12} md={6}><TextField fullWidth label={t('appBuilder.logoUrl')} value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} /></Grid><Grid item xs={12} md={4}><TextField fullWidth label={t('appBuilder.primaryColor')} value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} /></Grid><Grid item xs={12} md={4}><TextField fullWidth label={t('appBuilder.secondaryColor')} value={form.secondary_color} onChange={e => setForm({ ...form, secondary_color: e.target.value })} /></Grid><Grid item xs={12} md={4}><TextField fullWidth label={t('appBuilder.accentColor')} value={form.accent_color} onChange={e => setForm({ ...form, accent_color: e.target.value })} /></Grid><Grid item xs={12} md={4}><TextField fullWidth select label={t('appBuilder.defaultTheme')} value={form.default_theme} onChange={e => setForm({ ...form, default_theme: e.target.value as ThemePreference })}>{(['light','dark','system'] as ThemePreference[]).map(v => <MenuItem key={v} value={v}>{t(`common.${v}`)}</MenuItem>)}</TextField></Grid><Grid item xs={12} md={4}><TextField fullWidth label={t('appBuilder.supportEmail')} value={form.support_email} onChange={e => setForm({ ...form, support_email: e.target.value })} /></Grid><Grid item xs={12} md={4}><TextField fullWidth label={t('appBuilder.businessName')} value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} /></Grid><Grid item xs={12}><TextField fullWidth label={t('appBuilder.trainerDisplayName')} value={form.trainer_display_name} onChange={e => setForm({ ...form, trainer_display_name: e.target.value })} /></Grid></Grid><LocalizedJsonEditor label={t('appBuilder.loginTitle')} value={form.login_title} onChange={login_title => setForm({ ...form, login_title })} multiline={false} /><LocalizedJsonEditor label={t('appBuilder.loginSubtitle')} value={form.login_subtitle} onChange={login_subtitle => setForm({ ...form, login_subtitle })} /><Button variant="contained" onClick={() => mutation.mutate()} disabled={mutation.isPending}>{t('appBuilder.saveSection')}</Button></Stack></CardContent></Card></Stack>;
}
