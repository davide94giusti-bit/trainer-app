import React from 'react';
import { Alert, Button, Card, CardContent, Stack, TextField } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import AdminPageHeader from '../../../components/admin/AdminPageHeader';
import AppBuilderTabs from '../../../components/admin/AppBuilderTabs';
import LoadingScreen from '../../../components/LoadingScreen';
import { listPolicySettings, savePolicySetting, type PolicySetting } from '../../../services/appBuilder.service';
import { queryClient } from '../../../lib/queryClient';
import { useI18n } from '../../../lib/i18n';

export default function PolicySettingsPage() {
  const { t } = useI18n();
  const query = useQuery({ queryKey: ['app-policy-settings'], queryFn: listPolicySettings });
  const mutation = useMutation({ mutationFn: savePolicySetting, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-policy-settings'] }) });
  if (query.isLoading) return <LoadingScreen />;
  return <Stack spacing={2}><AdminPageHeader title={t('appBuilder.policies.title')} /><AppBuilderTabs />{query.error && <Alert severity="error">{(query.error as Error).message}</Alert>}{mutation.error && <Alert severity="error">{(mutation.error as Error).message}</Alert>}{mutation.isSuccess && <Alert severity="success">{t('appBuilder.updated')}</Alert>}{(query.data ?? []).map(setting => <PolicyCard key={setting.key} setting={setting} onSave={s => mutation.mutate(s)} saving={mutation.isPending} />)}</Stack>;
}

function PolicyCard({ setting, onSave, saving }: { setting: PolicySetting; onSave: (setting: PolicySetting) => void; saving: boolean }) {
  const { t } = useI18n();
  const policyLabels: Record<string, string> = { cancellation_window_hours: t('appBuilder.policy.cancellationWindowHours'), late_cancel_policy: t('appBuilder.policy.lateCancellationPolicy'), booking_without_credits: t('appBuilder.policy.bookingWithoutCredits'), reschedule_window_hours: t('appBuilder.policy.rescheduleWindowHours'), shared_session_discount_percent: t('appBuilder.policy.sharedSessionDiscountPercent'), default_session_duration: t('appBuilder.policy.defaultSessionDuration'), maximum_advance_booking_days: t('appBuilder.policy.maximumAdvanceBookingDays') };
  const translatedLabel = policyLabels[setting.key] ?? setting.label;
  const [value, setValue] = React.useState(String(setting.value ?? ''));
  React.useEffect(() => setValue(String(setting.value ?? '')), [setting.value]);
  const normalized = value === 'true' ? true : value === 'false' ? false : Number.isFinite(Number(value)) && value.trim() !== '' ? Number(value) : value;
  return <Card><CardContent><Stack spacing={2}><TextField label={translatedLabel} value={value} onChange={e => setValue(e.target.value)} helperText={setting.key} /><Button variant="contained" onClick={() => onSave({ ...setting, value: normalized })} disabled={saving}>{t('common.save')}</Button></Stack></CardContent></Card>;
}
