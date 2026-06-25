import { Alert, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import LoadingScreen from '../components/LoadingScreen';
import StatusChip from '../components/StatusChip';
import { listPayments } from '../services/payments.service';
import { formatDateTime, formatMoney } from '../lib/format';

export default function PaymentsPage() {
  const query = useQuery({ queryKey: ['payments'], queryFn: listPayments });
  if (query.isLoading) return <LoadingScreen />;
  if (query.error) return <Alert severity="error">{(query.error as Error).message}</Alert>;
  return <Stack spacing={2}><Typography variant="h4">Payments</Typography><DataTable rows={query.data ?? []} columns={[{ key: 'created_at', header: 'Created', render: r => formatDateTime(r.created_at) }, { key: 'amount', header: 'Amount', render: r => formatMoney(r.amount, r.currency) }, { key: 'method', header: 'Method' }, { key: 'status', header: 'Status', render: r => <StatusChip status={r.status} /> }]} /></Stack>;
}
