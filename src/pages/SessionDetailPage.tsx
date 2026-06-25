import { Alert, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import DataTable from '../components/DataTable';
import StatusChip from '../components/StatusChip';
import { cancelSession, getSession } from '../services/sessions.service';
import { formatDateTime, localized } from '../lib/format';
import { queryClient } from '../lib/queryClient';

export default function SessionDetailPage() {
  const { id } = useParams();
  const query = useQuery({ queryKey: ['session', id], queryFn: () => getSession(id!), enabled: !!id });
  const cancel = useMutation({ mutationFn: () => cancelSession(id!, 'Customer requested cancellation'), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['session', id] }) });
  if (query.isLoading) return <LoadingScreen />;
  if (query.error) return <Alert severity="error">{(query.error as Error).message}</Alert>;
  const session: any = query.data;
  return <Stack spacing={2}><Card><CardContent><Stack spacing={1}><Typography variant="h4">Session detail</Typography><Typography>{formatDateTime(session.start_at)} - {formatDateTime(session.end_at)}</Typography><StatusChip status={session.status} /><Typography color="text.secondary">{session.notes}</Typography><Button color="warning" disabled={cancel.isPending || session.status === 'cancelled'} onClick={() => cancel.mutate()}>Request/cancel session</Button></Stack></CardContent></Card><Typography variant="h6">Exercises</Typography><DataTable rows={session.session_exercises ?? []} columns={[{ key: 'exercise', header: 'Exercise', render: r => localized(r.exercises?.name) }, { key: 'sets', header: 'Sets' }, { key: 'reps', header: 'Reps' }, { key: 'notes', header: 'Notes' }]} /></Stack>;
}
