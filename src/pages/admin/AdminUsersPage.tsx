import { Alert, Button, Stack } from '@mui/material';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import DataTable from '../../components/DataTable';
import LoadingScreen from '../../components/LoadingScreen';
import StatusChip from '../../components/StatusChip';
import { formatDateTime } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { listAdminUsers } from '../../services/adminUsers.service';

export default function AdminUsersPage() {
  const { t } = useI18n();
  const query = useQuery({ queryKey: ['admin-users'], queryFn: listAdminUsers });
  if (query.isLoading) return <LoadingScreen />;
  if (query.error) return <Alert severity="error">{(query.error as Error).message}</Alert>;
  return <Stack spacing={2}><AdminPageHeader title={t('admin.admins.title')} action={<Button component={Link} to="/admin/admins/new" variant="contained">{t('admin.admins.create')}</Button>} /><DataTable rows={query.data ?? []} columns={[{ key: 'full_name', header: t('common.name') }, { key: 'email', header: t('common.email') }, { key: 'phone', header: t('common.phone') }, { key: 'status', header: t('common.status'), render: r => <StatusChip status={r.status} /> }, { key: 'created_at', header: t('common.createdAt'), render: r => formatDateTime(r.created_at) }, { key: 'updated_at', header: t('common.updatedAt'), render: r => formatDateTime(r.updated_at) }, { key: 'actions', header: t('common.actions'), render: r => <Button component={Link} to={`/admin/admins/${r.id}`} variant="outlined" size="small">{t('common.open')}</Button> }]} /></Stack>;
}
