import { Alert, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import StatCard from '../components/StatCard';
import LoadingScreen from '../components/LoadingScreen';
import { getMyCreditBalance } from '../services/credits.service';
import { listSessions } from '../services/sessions.service';
import { listBookingRequests } from '../services/bookings.service';
import { listNotifications } from '../services/notifications.service';
import { formatDateTime } from '../lib/format';
import { useI18n } from '../lib/i18n';

export default function DashboardPage() {
  const { t } = useI18n();
  const credits = useQuery({ queryKey: ['my-credit-balance'], queryFn: getMyCreditBalance });
  const sessions = useQuery({ queryKey: ['sessions'], queryFn: listSessions });
  const bookings = useQuery({ queryKey: ['booking-requests'], queryFn: listBookingRequests });
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: listNotifications });
  if (credits.isLoading || sessions.isLoading) return <LoadingScreen />;
  const next = sessions.data?.find((s: any) => ['scheduled', 'confirmed'].includes(s.status));
  return <Stack spacing={3}><Typography variant="h4">{t('nav.dashboard')}</Typography>{credits.error && <Alert severity="warning">{(credits.error as Error).message}</Alert>}<Grid container spacing={2}><Grid item xs={12} md={3}><StatCard label={t('dashboard.credits')} value={credits.data ?? '-'} /></Grid><Grid item xs={12} md={3}><StatCard label={t('dashboard.nextSession')} value={next ? formatDateTime(next.start_at) : '-'} detail={next?.status} /></Grid><Grid item xs={12} md={3}><StatCard label={t('dashboard.pendingBookings')} value={(bookings.data ?? []).filter((b: any) => b.status === 'pending').length} /></Grid><Grid item xs={12} md={3}><StatCard label={t('nav.notifications')} value={(notifications.data ?? []).filter((n: any) => n.status === 'unread').length} /></Grid></Grid><Card><CardContent><Typography variant="h6" gutterBottom>{t('customer.upcomingWork')}</Typography><Typography color="text.secondary">{t('customer.upcomingWorkDetail')}</Typography></CardContent></Card></Stack>;
}
