import { Alert, Button, Card, CardContent, FormControlLabel, MenuItem, Stack, Switch, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { createCustomerProfile } from '../../services/customers.service';
import { queryClient } from '../../lib/queryClient';
import { useI18n } from '../../lib/i18n';
import type { Language, ThemePreference, UserStatus } from '../../types/domain';

const schema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  language: z.enum(['en', 'es', 'it']),
  theme: z.enum(['light', 'dark', 'system']),
  objective: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['invited', 'active', 'deactivated']),
  temporaryPassword: z.string().optional(),
  sendInvite: z.boolean(),
  startingCredits: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateCustomerPage() {
  const { t } = useI18n();
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', fullName: '', phone: '', language: 'en', theme: 'system', objective: '', notes: '', status: 'invited', temporaryPassword: '', sendInvite: true, startingCredits: 0 } });
  const mutation = useMutation({ mutationFn: createCustomerProfile, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-customers'] }); reset(); } });
  const sendInvite = watch('sendInvite');
  return <Stack spacing={2}><AdminPageHeader title={t('admin.customers.createTitle')} subtitle={t('admin.customers.secureNotice')} />{mutation.error && <Alert severity="error">{(mutation.error as Error).message}</Alert>}{mutation.isSuccess && <Alert severity="success">{t('admin.customers.created')}</Alert>}<Card><CardContent><form onSubmit={handleSubmit(v => mutation.mutate(v))}><Stack spacing={2}><TextField label={t('common.email')} {...register('email')} error={!!errors.email} helperText={errors.email?.message} /><TextField label={t('common.fullName')} {...register('fullName')} error={!!errors.fullName} helperText={errors.fullName?.message} /><TextField label={t('common.phone')} {...register('phone')} /><TextField select label={t('common.language')} defaultValue="en" {...register('language')}>{(['en','es','it'] as Language[]).map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField><TextField select label={t('common.theme')} defaultValue="system" {...register('theme')}>{(['light','dark','system'] as ThemePreference[]).map(v => <MenuItem key={v} value={v}>{t(`common.${v}`)}</MenuItem>)}</TextField><TextField label={t('common.objective')} multiline minRows={3} {...register('objective')} /><TextField label={t('common.notes')} multiline minRows={2} {...register('notes')} /><TextField select label={t('admin.customers.initialStatus')} defaultValue="invited" {...register('status')}>{(['invited','active','deactivated'] as UserStatus[]).map(v => <MenuItem key={v} value={v}>{t(`common.${v}`)}</MenuItem>)}</TextField><TextField label={t('admin.customers.startingCredits')} type="number" inputProps={{ min: 0, step: 1 }} {...register('startingCredits')} error={!!errors.startingCredits} helperText={errors.startingCredits?.message} /><FormControlLabel control={<Switch checked={sendInvite} onChange={event => setValue('sendInvite', event.target.checked)} />} label={t('admin.customers.sendInvite')} />{!sendInvite && <TextField label={t('admin.customers.temporaryPassword')} type="password" {...register('temporaryPassword')} />}<Button type="submit" variant="contained" disabled={mutation.isPending}>{t('common.create')}</Button></Stack></form></CardContent></Card></Stack>;
}
