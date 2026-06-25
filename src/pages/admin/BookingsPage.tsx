import { Alert, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import DataTable from '../../components/DataTable';
import LoadingScreen from '../../components/LoadingScreen';
import StatusChip from '../../components/StatusChip';
import {
  acceptBookingRequest,
  declineBookingRequest,
  decideSharedSessionAsTrainer,
  listAdminSharedSessionRequests,
  listBookingRequests,
} from '../../services/bookings.service';
import { formatDateTime } from '../../lib/format';
import { queryClient } from '../../lib/queryClient';
import { useI18n } from '../../lib/i18n';


function focusLabel(value: string | null | undefined, t: (key: string, fallbackOrVars?: string | Record<string, string | number>) => string) {
  if (!value) return '-';
  const labels: Record<string, string> = {
    'Upper body': t('focus.upperBody'),
    'Lower body': t('focus.lowerBody'),
    Legs: t('focus.legs'),
    Cardio: t('focus.cardio'),
    Core: t('focus.core'),
  };
  return labels[value] ?? value;
}

export default function BookingsPage() {
  const { t } = useI18n();
  const bookingRequests = useQuery({ queryKey: ['admin-bookings'], queryFn: listBookingRequests });
  const sharedRequests = useQuery({ queryKey: ['admin-shared-session-requests'], queryFn: listAdminSharedSessionRequests });
  const accept = useMutation({ mutationFn: acceptBookingRequest, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }) });
  const decline = useMutation({ mutationFn: (id: string) => declineBookingRequest(id, t('admin.bookings.declinedByAdmin')), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }) });
  const decideShared = useMutation({
    mutationFn: (input: { requestId: string; decision: 'accepted' | 'declined' }) => decideSharedSessionAsTrainer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shared-session-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
  });

  if (bookingRequests.isLoading || sharedRequests.isLoading) return <LoadingScreen />;
  const error = bookingRequests.error || sharedRequests.error || accept.error || decline.error || decideShared.error;

  return <Stack spacing={2}>
    <AdminPageHeader title={t('nav.bookings')} />
    {error && <Alert severity="error">{(error as Error).message}</Alert>}
    {decideShared.isSuccess && <Alert severity="success">{t('admin.bookings.sharedDecisionSaved')}</Alert>}

    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">{t('admin.bookings.bookingRequests')}</Typography>
          <DataTable rows={bookingRequests.data ?? []} columns={[
            { key: 'requested_start', header: t('common.start'), render: r => formatDateTime(r.requested_start) },
            { key: 'requested_end', header: t('common.end'), render: r => formatDateTime(r.requested_end) },
            { key: 'status', header: t('common.status'), render: r => <StatusChip status={r.status} /> },
            { key: 'actions', header: t('common.actions'), render: r => <Stack direction="row" spacing={1}><Button size="small" disabled={r.status !== 'pending'} onClick={() => accept.mutate(r.id)}>{t('common.accept')}</Button><Button size="small" color="error" disabled={r.status !== 'pending'} onClick={() => decline.mutate(r.id)}>{t('common.decline')}</Button></Stack> },
          ]} />
        </Stack>
      </CardContent>
    </Card>

    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">{t('admin.bookings.sharedSessionRequests')}</Typography>
          <DataTable rows={sharedRequests.data ?? []} columns={[
            { key: 'session_title', header: t('availability.sessionTitle'), render: r => r.session_title ?? t('availability.trainingSession') },
            { key: 'focus_area', header: t('availability.sessionTypeFilter'), render: r => focusLabel(r.focus_area, t) },
            { key: 'start_at', header: t('common.start'), render: r => formatDateTime(r.start_at) },
            { key: 'requester_name', header: t('admin.bookings.requester') },
            { key: 'target_customer_name', header: t('admin.bookings.currentCustomer') },
            { key: 'requester_status', header: t('availability.customerApproval'), render: r => <StatusChip status={r.requester_status} /> },
            { key: 'trainer_status', header: t('availability.trainerApproval'), render: r => <StatusChip status={r.trainer_status} /> },
            { key: 'discount_percent', header: t('availability.discount'), render: r => `${r.discount_percent}%` },
            { key: 'actions', header: t('common.actions'), render: r => <Stack direction="row" spacing={1}><Button size="small" disabled={r.trainer_status !== 'pending'} onClick={() => decideShared.mutate({ requestId: r.id, decision: 'accepted' })}>{t('common.accept')}</Button><Button size="small" color="error" disabled={r.trainer_status !== 'pending'} onClick={() => decideShared.mutate({ requestId: r.id, decision: 'declined' })}>{t('common.decline')}</Button></Stack> },
          ]} />
        </Stack>
      </CardContent>
    </Card>
  </Stack>;
}
