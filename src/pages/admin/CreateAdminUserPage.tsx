import { Alert, Button, Card, CardContent, FormControlLabel, MenuItem, Stack, Switch, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { createAdminOrCustomerUser } from '../../services/adminUsers.service';
import { queryClient } from '../../lib/queryClient';
import { useI18n } from '../../lib/i18n';
import type { Language, ThemePreference, UserStatus } from '../../types/domain';

const schema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  language: z.enum(['en', 'es', 'it']),
  theme: z.enum(['light', 'dark', 'system']),
  status: z.enum(['invited', 'active', 'deactivated']),
  temporaryPassword: z.string().optional(),
  sendInvite: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateAdminUserPage() {
  const { t } = useI18n();
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', fullName: '', phone: '', language: 'en', theme: 'system', status: 'invited', temporaryPassword: '', sendInvite: true } });
  const mutation = useMutation({ mutationFn: (values: FormValues) => createAdminOrCustomerUser({ ...values, role: 'admin' }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); reset(); } });
  const sendInvite = watch('sendInvite');
  return <Stack spacing={2}><AdminPageHeader title={t('admin.admins.createTitle')} subtitle={t('admin.customers.secureNotice')} />{mutation.error && <Alert severity="error">{(mutation.error as Error).message}</Alert>}{mutation.isSuccess && <Alert severity="success">{t('admin.admins.created')}</Alert>}<Card><CardContent><form onSubmit={handleSubmit(values => mutation.mutate(values))}><Stack spacing={2}><TextField label={t('common.email')} {...register('email')} error={!!errors.email} helperText={errors.email?.message} /><TextField label={t('common.fullName')} {...register('fullName')} error={!!errors.fullName} helperText={errors.fullName?.message} /><TextField label={t('common.phone')} {...register('phone')} /><TextField select label={t('common.language')} defaultValue="en" {...register('language')}>{(['en','es','it'] as Language[]).map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField><TextField select label={t('common.theme')} defaultValue="system" {...register('theme')}>{(['light','dark','system'] as ThemePreference[]).map(v => <MenuItem key={v} value={v}>{t(`common.${v}`)}</MenuItem>)}</TextField><TextField select label={t('admin.customers.initialStatus')} defaultValue="invited" {...register('status')}>{(['invited','active','deactivated'] as UserStatus[]).map(v => <MenuItem key={v} value={v}>{t(`common.${v}`)}</MenuItem>)}</TextField><FormControlLabel control={<Switch checked={sendInvite} onChange={event => setValue('sendInvite', event.target.checked)} />} label={t('admin.customers.sendInvite')} />{!sendInvite && <TextField label={t('admin.customers.temporaryPassword')} type="password" {...register('temporaryPassword')} error={!!errors.temporaryPassword} helperText={errors.temporaryPassword?.message} />}<Button type="submit" variant="contained" disabled={mutation.isPending}>{t('common.create')}</Button></Stack></form></CardContent></Card></Stack>;
}
