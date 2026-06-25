import { Alert, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import LoadingScreen from '../components/LoadingScreen';
import { listBodyMetrics } from '../services/metrics.service';
import { formatDate } from '../lib/format';

export default function MetricsPage() {
  const query = useQuery({ queryKey: ['body-metrics'], queryFn: listBodyMetrics });
  if (query.isLoading) return <LoadingScreen />;
  if (query.error) return <Alert severity="error">{(query.error as Error).message}</Alert>;
  return <Stack spacing={2}><Typography variant="h4">Metrics</Typography><DataTable rows={query.data ?? []} columns={[{ key: 'measured_at', header: 'Date', render: r => formatDate(r.measured_at) }, { key: 'weight_kg', header: 'Weight kg' }, { key: 'body_fat_percent', header: 'Body fat %' }, { key: 'waist_cm', header: 'Waist cm' }, { key: 'notes', header: 'Notes' }]} /></Stack>;
}
