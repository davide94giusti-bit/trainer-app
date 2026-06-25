import { Alert, Button, Stack, Typography } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import DataTable from '../../components/DataTable';
import LoadingScreen from '../../components/LoadingScreen';
import StatusChip from '../../components/StatusChip';
import { acceptBookingRequest, declineBookingRequest, listBookingRequests } from '../../services/bookings.service';
import { formatDateTime } from '../../lib/format';
import { queryClient } from '../../lib/queryClient';

export default function BookingsPage() {
  const query = useQuery({ queryKey: ['admin-bookings'], queryFn: listBookingRequests });
  const accept = useMutation({ mutationFn: acceptBookingRequest, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }) });
  const decline = useMutation({ mutationFn: (id: string) => declineBookingRequest(id, 'Declined by admin'), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }) });
  if (query.isLoading) return <LoadingScreen />;
  if (query.error) return <Alert severity="error">{(query.error as Error).message}</Alert>;
  return <Stack spacing={2}><Typography variant="h4">Bookings</Typography><DataTable rows={query.data ?? []} columns={[{ key: 'requested_start', header: 'Start', render: r => formatDateTime(r.requested_start) }, { key: 'requested_end', header: 'End', render: r => formatDateTime(r.requested_end) }, { key: 'status', header: 'Status', render: r => <StatusChip status={r.status} /> }, { key: 'actions', header: '', render: r => <Stack direction="row" spacing={1}><Button size="small" disabled={r.status !== 'pending'} onClick={() => accept.mutate(r.id)}>Accept</Button><Button size="small" color="error" disabled={r.status !== 'pending'} onClick={() => decline.mutate(r.id)}>Decline</Button></Stack> }]} /></Stack>;
}
