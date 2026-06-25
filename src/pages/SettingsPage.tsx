import { Alert, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import LoadingScreen from '../components/LoadingScreen';
import { getMyProfile, updateMyProfile } from '../services/profiles.service';
import { queryClient } from '../lib/queryClient';
import { useI18n } from '../lib/i18n';
import { useThemePreference } from '../theme/ThemeProvider';
import type { Language, ThemePreference } from '../types/domain';

export default function SettingsPage() {
  const { setLanguage } = useI18n();
  const { setPreference } = useThemePreference();
  const profile = useQuery({ queryKey: ['my-profile'], queryFn: getMyProfile });
  const [form, setForm] = useState({ full_name: '', phone: '', language: 'en' as Language, theme: 'system' as ThemePreference });
  useEffect(() => { if (profile.data) setForm({ full_name: profile.data.full_name ?? '', phone: profile.data.phone ?? '', language: profile.data.language, theme: profile.data.theme }); }, [profile.data]);
  const mutation = useMutation({ mutationFn: () => updateMyProfile(form), onSuccess: data => { setLanguage(data.language); setPreference(data.theme); queryClient.invalidateQueries({ queryKey: ['my-profile'] }); } });
  if (profile.isLoading) return <LoadingScreen />;
  return <Stack spacing={2}><Typography variant="h4">Settings</Typography>{mutation.error && <Alert severity="error">{(mutation.error as Error).message}</Alert>}{mutation.isSuccess && <Alert severity="success">Saved.</Alert>}<Card><CardContent><Stack spacing={2}><TextField label="Full name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /><TextField label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /><TextField select label="Language" value={form.language} onChange={e => setForm({ ...form, language: e.target.value as Language })}>{['en','es','it'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField><TextField select label="Theme" value={form.theme} onChange={e => setForm({ ...form, theme: e.target.value as ThemePreference })}>{['light','dark','system'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField><Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Save</Button></Stack></CardContent></Card></Stack>;
}
