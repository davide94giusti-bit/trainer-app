import { Alert, Button, Stack, Typography } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import DataTable from '../../components/DataTable';
import LoadingScreen from '../../components/LoadingScreen';
import StatusChip from '../../components/StatusChip';
import { listPayments, markPaymentCompleted, markPaymentRejected } from '../../services/payments.service';
import { formatDateTime, formatMoney } from '../../lib/format';
import { queryClient } from '../../lib/queryClient';

export default function AdminPaymentsPage() {
  const query = useQuery({ queryKey: ['admin-payments'], queryFn: listPayments });
  const complete = useMutation({ mutationFn: markPaymentCompleted, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-payments'] }) });
  const reject = useMutation({ mutationFn: (id: string) => markPaymentRejected(id, 'Rejected by admin'), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-payments'] }) });
  if (query.isLoading) return <LoadingScreen />;
  if (query.error) return <Alert severity="error">{(query.error as Error).message}</Alert>;
  return <Stack spacing={2}><Typography variant="h4">Payments</Typography><DataTable rows={query.data ?? []} columns={[{ key: 'created_at', header: 'Created', render: r => formatDateTime(r.created_at) }, { key: 'amount', header: 'Amount', render: r => formatMoney(r.amount, r.currency) }, { key: 'status', header: 'Status', render: r => <StatusChip status={r.status} /> }, { key: 'actions', header: '', render: r => <Stack direction="row" spacing={1}><Button size="small" disabled={r.status === 'completed'} onClick={() => complete.mutate(r.id)}>Complete</Button><Button size="small" color="error" disabled={r.status === 'rejected'} onClick={() => reject.mutate(r.id)}>Reject</Button></Stack> }]} /></Stack>;
}
