import { Alert, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import LoadingScreen from '../components/LoadingScreen';
import StatusChip from '../components/StatusChip';
import { listPayments } from '../services/payments.service';
import { formatDateTime, formatMoney } from '../lib/format';
import { useI18n } from '../lib/i18n';

export default function PaymentsPage() {
  const { t, language } = useI18n();
  const query = useQuery({ queryKey: ['payments'], queryFn: listPayments });
  if (query.isLoading) return <LoadingScreen />;
  if (query.error) return <Alert severity="error">{(query.error as Error).message}</Alert>;
  return <Stack spacing={2}><Typography variant="h4">{t('nav.payments')}</Typography><DataTable rows={query.data ?? []} columns={[{ key: 'created_at', header: t('common.created'), render: r => formatDateTime(r.created_at) }, { key: 'amount', header: t('common.amount'), render: r => formatMoney(r.amount, r.currency, language) }, { key: 'method', header: t('customer.method') }, { key: 'status', header: t('common.status'), render: r => <StatusChip status={r.status} /> }]} /></Stack>;
}
