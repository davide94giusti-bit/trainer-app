import { Alert, Button, Stack } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import DataTable from '../../components/DataTable';
import LoadingScreen from '../../components/LoadingScreen';
import StatusChip from '../../components/StatusChip';
import { listPayments, markPaymentCompleted, markPaymentRejected } from '../../services/payments.service';
import { formatDateTime, formatMoney } from '../../lib/format';
import { queryClient } from '../../lib/queryClient';
import { useI18n } from '../../lib/i18n';

export default function AdminPaymentsPage() {
  const { t, language } = useI18n();
  const query = useQuery({ queryKey: ['admin-payments'], queryFn: listPayments });
  const complete = useMutation({ mutationFn: markPaymentCompleted, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-payments'] }) });
  const reject = useMutation({ mutationFn: (id: string) => markPaymentRejected(id, 'Rejected by admin'), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-payments'] }) });
  if (query.isLoading) return <LoadingScreen />;
  if (query.error) return <Alert severity="error">{(query.error as Error).message}</Alert>;
  return <Stack spacing={2}><AdminPageHeader title={t('nav.payments')} /><DataTable rows={query.data ?? []} columns={[{ key: 'created_at', header: t('common.created'), render: r => formatDateTime(r.created_at) }, { key: 'amount', header: t('common.amount'), render: r => formatMoney(r.amount, r.currency, language) }, { key: 'status', header: t('common.status'), render: r => <StatusChip status={r.status} /> }, { key: 'actions', header: t('common.actions'), render: r => <Stack direction="row" spacing={1}><Button size="small" disabled={r.status === 'completed'} onClick={() => complete.mutate(r.id)}>{t('common.complete')}</Button><Button size="small" color="error" disabled={r.status === 'rejected'} onClick={() => reject.mutate(r.id)}>{t('common.reject')}</Button></Stack> }]} /></Stack>;
}
