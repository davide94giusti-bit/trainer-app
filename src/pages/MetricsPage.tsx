import { Alert, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import LoadingScreen from '../components/LoadingScreen';
import { listBodyMetrics } from '../services/metrics.service';
import { formatDate } from '../lib/format';
import { useI18n } from '../lib/i18n';

export default function MetricsPage() {
  const { t } = useI18n();
  const query = useQuery({ queryKey: ['body-metrics'], queryFn: listBodyMetrics });
  if (query.isLoading) return <LoadingScreen />;
  if (query.error) return <Alert severity="error">{(query.error as Error).message}</Alert>;
  return <Stack spacing={2}><Typography variant="h4">{t('nav.metrics')}</Typography><DataTable rows={query.data ?? []} columns={[{ key: 'measured_at', header: t('metrics.date'), render: r => formatDate(r.measured_at) }, { key: 'weight_kg', header: t('metrics.weightKg') }, { key: 'body_fat_percent', header: t('metrics.bodyFat') }, { key: 'waist_cm', header: t('metrics.waistCm') }, { key: 'notes', header: t('common.notes') }]} /></Stack>;
}
