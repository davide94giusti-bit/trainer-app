import { Alert, Stack, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../components/DataTable';
import LoadingScreen from '../components/LoadingScreen';
import StatusChip from '../components/StatusChip';
import { listSessions } from '../services/sessions.service';
import { formatDateTime } from '../lib/format';

export default function SessionsPage() {
  const query = useQuery({ queryKey: ['sessions'], queryFn: listSessions });
  if (query.isLoading) return <LoadingScreen />;
  if (query.error) return <Alert severity="error">{(query.error as Error).message}</Alert>;
  return <Stack spacing={2}><Typography variant="h4">Sessions</Typography><DataTable rows={query.data ?? []} columns={[{ key: 'start_at', header: 'Start', render: r => formatDateTime(r.start_at) }, { key: 'end_at', header: 'End', render: r => formatDateTime(r.end_at) }, { key: 'status', header: 'Status', render: r => <StatusChip status={r.status} /> }, { key: 'actions', header: '', render: r => <Button component={Link} to={`/sessions/${r.id}`} variant="outlined" size="small">Open</Button> }]} /></Stack>;
}
