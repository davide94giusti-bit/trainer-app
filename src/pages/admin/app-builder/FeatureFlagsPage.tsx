import { Alert, Button, Card, CardContent, Stack } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import AdminPageHeader from '../../../components/admin/AdminPageHeader';
import AppBuilderTabs from '../../../components/admin/AppBuilderTabs';
import FeatureFlagSwitch from '../../../components/admin/FeatureFlagSwitch';
import LoadingScreen from '../../../components/LoadingScreen';
import { listFeatureFlags, saveFeatureFlag, type FeatureFlag } from '../../../services/appBuilder.service';
import { queryClient } from '../../../lib/queryClient';
import { useI18n } from '../../../lib/i18n';

export default function FeatureFlagsPage() {
  const { t } = useI18n();
  const featureLabels: Record<string, string> = { booking_requests: t('appBuilder.feature.bookingRequests'), reschedule_requests: t('appBuilder.feature.rescheduleRequests'), payments_page: t('appBuilder.feature.paymentsPage'), credits_display: t('appBuilder.feature.creditsDisplay'), body_metrics_page: t('appBuilder.feature.bodyMetricsPage'), notifications: t('appBuilder.feature.notifications'), shared_session_requests: t('appBuilder.feature.sharedSessionRequests'), exercise_media_display: t('appBuilder.feature.exerciseMediaDisplay'), customer_profile_editing: t('appBuilder.feature.customerProfileEditing') };
  const query = useQuery({ queryKey: ['app-feature-flags'], queryFn: listFeatureFlags });
  const mutation = useMutation({ mutationFn: saveFeatureFlag, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-feature-flags'] }) });
  if (query.isLoading) return <LoadingScreen />;
  return <Stack spacing={2}><AdminPageHeader title={t('appBuilder.features.title')} /><AppBuilderTabs />{query.error && <Alert severity="error">{(query.error as Error).message}</Alert>}{mutation.error && <Alert severity="error">{(mutation.error as Error).message}</Alert>}{mutation.isSuccess && <Alert severity="success">{t('appBuilder.updated')}</Alert>}<Card><CardContent><Stack spacing={1}>{(query.data ?? []).map((flag: FeatureFlag) => <Stack key={flag.key} direction="row" justifyContent="space-between" alignItems="center"><FeatureFlagSwitch label={featureLabels[flag.key] ?? flag.label} checked={flag.enabled} onChange={enabled => mutation.mutate({ ...flag, enabled })} /><Button size="small" onClick={() => mutation.mutate(flag)}>{t('common.save')}</Button></Stack>)}</Stack></CardContent></Card></Stack>;
}
