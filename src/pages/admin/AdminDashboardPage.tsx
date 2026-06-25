import { Alert, Grid, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import StatCard from '../../components/StatCard';
import LoadingScreen from '../../components/LoadingScreen';
import { listSessions } from '../../services/sessions.service';
import { listBookingRequests } from '../../services/bookings.service';
import { listPayments } from '../../services/payments.service';
import { listCustomers } from '../../services/customers.service';
import { useI18n } from '../../lib/i18n';

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const sessions = useQuery({ queryKey: ['admin-sessions'], queryFn: listSessions });
  const bookings = useQuery({ queryKey: ['admin-bookings'], queryFn: listBookingRequests });
  const payments = useQuery({ queryKey: ['admin-payments'], queryFn: listPayments });
  const customers = useQuery({ queryKey: ['admin-customers'], queryFn: listCustomers });
  if (sessions.isLoading || bookings.isLoading || payments.isLoading || customers.isLoading) return <LoadingScreen />;
  if (sessions.error) return <Alert severity="error">{(sessions.error as Error).message}</Alert>;
  const today = new Date().toISOString().slice(0, 10);
  return <Stack spacing={2}><AdminPageHeader title={t('admin.dashboard.title')} /><Grid container spacing={2}><Grid item xs={12} md={3}><StatCard label={t('admin.dashboard.todaysSessions')} value={(sessions.data ?? []).filter((s: any) => String(s.start_at).startsWith(today)).length} /></Grid><Grid item xs={12} md={3}><StatCard label={t('admin.dashboard.pendingBookings')} value={(bookings.data ?? []).filter((b: any) => b.status === 'pending').length} /></Grid><Grid item xs={12} md={3}><StatCard label={t('admin.dashboard.pendingPayments')} value={(payments.data ?? []).filter((p: any) => ['pending','awaiting_confirmation'].includes(p.status)).length} /></Grid><Grid item xs={12} md={3}><StatCard label={t('admin.dashboard.customers')} value={(customers.data ?? []).length} /></Grid></Grid></Stack>;
}
