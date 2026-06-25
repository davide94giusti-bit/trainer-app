import { Alert, Button, Stack } from '@mui/material';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import DataTable from '../../components/DataTable';
import LoadingScreen from '../../components/LoadingScreen';
import StatusChip from '../../components/StatusChip';
import { formatDateTime } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { listCustomers } from '../../services/customers.service';

export default function CustomersPage() {
  const { t } = useI18n();
  const query = useQuery({ queryKey: ['admin-customers'], queryFn: listCustomers });
  if (query.isLoading) return <LoadingScreen />;
  if (query.error) return <Alert severity="error">{(query.error as Error).message}</Alert>;
  return <Stack spacing={2}><AdminPageHeader title={t('admin.customers.title')} action={<Button component={Link} to="/admin/customers/new" variant="contained">{t('admin.customers.create')}</Button>} /><DataTable rows={query.data ?? []} columns={[{ key: 'full_name', header: t('common.name') }, { key: 'email', header: t('common.email') }, { key: 'phone', header: t('common.phone') }, { key: 'status', header: t('common.status'), render: r => <StatusChip status={r.status} /> }, { key: 'created_at', header: t('common.createdAt'), render: r => formatDateTime(r.created_at) }, { key: 'actions', header: t('common.actions'), render: r => <Button component={Link} to={`/admin/customers/${r.id}`} variant="outlined" size="small">{t('common.open')}</Button> }]} /></Stack>;
}
