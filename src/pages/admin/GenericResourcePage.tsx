import { Alert, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../../components/DataTable';
import LoadingScreen from '../../components/LoadingScreen';
import { supabase } from '../../lib/supabase';
import { formatDateTime, localized } from '../../lib/format';
import StatusChip from '../../components/StatusChip';
import { useI18n } from '../../lib/i18n';

export default function GenericResourcePage({ title, table, columns, createPath }: { title: string; table: string; columns?: string[]; createPath?: string }) {
  const { t } = useI18n();
  const query = useQuery({ queryKey: [table], queryFn: async () => {
    const { data, error } = await supabase.from(table).select('*').limit(100);
    if (error) throw error;
    return (data ?? []).sort((a: any, b: any) => String(b.created_at ?? b.updated_at ?? '').localeCompare(String(a.created_at ?? a.updated_at ?? '')));
  } });
  if (query.isLoading) return <LoadingScreen />;
  if (query.error) return <Alert severity="error">{(query.error as Error).message}</Alert>;
  const inferred = columns ?? Object.keys(query.data?.[0] ?? { id: '', status: '', updated_at: '' });
  return <Stack spacing={2}><Card><CardContent><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h5">{title}</Typography>{createPath && <Button href={createPath}>{t('common.create')}</Button>}</Stack></CardContent></Card><DataTable rows={query.data ?? []} columns={inferred.map(key => ({ key, header: key.split('_').join(' '), render: (row: any) => key.endsWith('_at') ? formatDateTime(row[key]) : key === 'status' ? <StatusChip status={row[key]} /> : typeof row[key] === 'object' ? localized(row[key]) || JSON.stringify(row[key]) : String(row[key] ?? '-') }))} /></Stack>;
}
