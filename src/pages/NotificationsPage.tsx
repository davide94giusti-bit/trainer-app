import { Alert, Button, Stack, Typography } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import LoadingScreen from '../components/LoadingScreen';
import StatusChip from '../components/StatusChip';
import { listNotifications, markNotificationRead } from '../services/notifications.service';
import { formatDateTime } from '../lib/format';
import { queryClient } from '../lib/queryClient';

export default function NotificationsPage() {
  const query = useQuery({ queryKey: ['notifications'], queryFn: listNotifications });
  const read = useMutation({ mutationFn: markNotificationRead, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }) });
  if (query.isLoading) return <LoadingScreen />;
  if (query.error) return <Alert severity="error">{(query.error as Error).message}</Alert>;
  return <Stack spacing={2}><Typography variant="h4">Notifications</Typography><DataTable rows={query.data ?? []} columns={[{ key: 'created_at', header: 'Created', render: r => formatDateTime(r.created_at) }, { key: 'title', header: 'Title' }, { key: 'message', header: 'Message' }, { key: 'status', header: 'Status', render: r => <StatusChip status={r.status} /> }, { key: 'actions', header: '', render: r => <Button size="small" variant="outlined" disabled={r.status === 'read'} onClick={() => read.mutate(r.id)}>Mark read</Button> }]} /></Stack>;
}
