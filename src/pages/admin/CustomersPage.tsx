import { Alert, Button, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DataTable from '../../components/DataTable';
import LoadingScreen from '../../components/LoadingScreen';
import StatusChip from '../../components/StatusChip';
import { listCustomers } from '../../services/customers.service';

export default function CustomersPage() {
  const query = useQuery({ queryKey: ['admin-customers'], queryFn: listCustomers });
  if (query.isLoading) return <LoadingScreen />;
  if (query.error) return <Alert severity="error">{(query.error as Error).message}</Alert>;
  return <Stack spacing={2}><Stack direction="row" justifyContent="space-between"><Typography variant="h4">Customers</Typography><Button component={Link} to="/admin/customers/new">Create customer</Button></Stack><DataTable rows={query.data ?? []} columns={[{ key: 'full_name', header: 'Name' }, { key: 'email', header: 'Email' }, { key: 'phone', header: 'Phone' }, { key: 'status', header: 'Status', render: r => <StatusChip status={r.status} /> }, { key: 'actions', header: '', render: r => <Button component={Link} to={`/admin/customers/${r.id}`} variant="outlined" size="small">Open</Button> }]} /></Stack>;
}
