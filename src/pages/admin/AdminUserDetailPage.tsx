import { Alert, Button, Card, CardContent, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import UserStatusActions from '../../components/admin/UserStatusActions';
import LoadingScreen from '../../components/LoadingScreen';
import StatusChip from '../../components/StatusChip';
import { formatDateTime } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { getProfileById, updateSafeProfile } from '../../services/adminUsers.service';
import { queryClient } from '../../lib/queryClient';
import type { Language, ThemePreference } from '../../types/domain';

export default function AdminUserDetailPage() {
  const { t } = useI18n();
  const { id } = useParams();
  const profile = useQuery({ queryKey: ['admin-user', id], queryFn: () => getProfileById(id!), enabled: !!id });
  const [form, setForm] = useState({ full_name: '', phone: '', language: 'en' as Language, theme: 'system' as ThemePreference });
  useEffect(() => { if (profile.data) setForm({ full_name: profile.data.full_name ?? '', phone: profile.data.phone ?? '', language: profile.data.language, theme: profile.data.theme }); }, [profile.data]);
  const save = useMutation({ mutationFn: () => updateSafeProfile(id!, form), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-user', id] }) });
  if (profile.isLoading) return <LoadingScreen />;
  if (profile.error) return <Alert severity="error">{(profile.error as Error).message}</Alert>;
  const user = profile.data;
  return <Stack spacing={2}><AdminPageHeader title={user.full_name ?? user.email ?? t('admin.admins.detailTitle')} subtitle={t('admin.admins.safeEdit')} />{save.error && <Alert severity="error">{(save.error as Error).message}</Alert>}{save.isSuccess && <Alert severity="success">{t('common.success')}</Alert>}<Grid container spacing={2}><Grid item xs={12} md={5}><Card><CardContent><Stack spacing={1}><Typography variant="h6">{t('admin.user.profile')}</Typography><Typography>{t('common.email')}: {user.email}</Typography><Typography>{t('common.status')}: <StatusChip status={user.status} /></Typography><Typography>{t('common.createdAt')}: {formatDateTime(user.created_at)}</Typography><Typography>{t('common.updatedAt')}: {formatDateTime(user.updated_at)}</Typography><UserStatusActions userId={user.id} status={user.status} invalidateKey={['admin-user', id]} /></Stack></CardContent></Card></Grid><Grid item xs={12} md={7}><Card><CardContent><Stack spacing={2}><Typography variant="h6">{t('common.edit')}</Typography><TextField label={t('common.fullName')} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /><TextField label={t('common.phone')} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /><TextField select label={t('common.language')} value={form.language} onChange={e => setForm({ ...form, language: e.target.value as Language })}>{(['en','es','it'] as Language[]).map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField><TextField select label={t('common.theme')} value={form.theme} onChange={e => setForm({ ...form, theme: e.target.value as ThemePreference })}>{(['light','dark','system'] as ThemePreference[]).map(v => <MenuItem key={v} value={v}>{t(`common.${v}`)}</MenuItem>)}</TextField><Button variant="contained" onClick={() => save.mutate()} disabled={save.isPending}>{t('common.save')}</Button></Stack></CardContent></Card></Grid></Grid></Stack>;
}
