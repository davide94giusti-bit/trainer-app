import { Alert, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../../components/DataTable';
import LoadingScreen from '../../components/LoadingScreen';
import { supabase } from '../../lib/supabase';
import { formatDateTime, localized } from '../../lib/format';
import StatusChip from '../../components/StatusChip';

export default function GenericResourcePage({ title, table, columns, createPath }: { title: string; table: string; columns?: string[]; createPath?: string }) {
  const query = useQuery({ queryKey: [table], queryFn: async () => { const { data, error } = await supabase.from(table).select('*').limit(100).order('created_at', { ascending: false }); if (error) throw error; return data ?? []; } });
  if (query.isLoading) return <LoadingScreen />;
  if (query.error) return <Alert severity="error">{(query.error as Error).message}</Alert>;
  const inferred = columns ?? Object.keys(query.data?.[0] ?? { id: '', status: '', created_at: '' });
  return <Stack spacing={2}><Card><CardContent><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h5">{title}</Typography>{createPath && <Button href={createPath}>Create</Button>}</Stack></CardContent></Card><DataTable rows={query.data ?? []} columns={inferred.map(key => ({ key, header: key.split('_').join(' '), render: (row: any) => key.includes('at') ? formatDateTime(row[key]) : key === 'status' ? <StatusChip status={row[key]} /> : typeof row[key] === 'object' ? localized(row[key]) || JSON.stringify(row[key]) : String(row[key] ?? '-') }))} /></Stack>;
}

