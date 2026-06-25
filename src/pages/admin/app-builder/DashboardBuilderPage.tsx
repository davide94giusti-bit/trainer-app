import { Alert, Button, Card, CardContent, Stack } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import AdminPageHeader from '../../../components/admin/AdminPageHeader';
import AppBuilderTabs from '../../../components/admin/AppBuilderTabs';
import SortableWidgetList from '../../../components/admin/SortableWidgetList';
import LoadingScreen from '../../../components/LoadingScreen';
import { listDashboardWidgets, saveDashboardWidgets, type DashboardWidget } from '../../../services/appBuilder.service';
import { queryClient } from '../../../lib/queryClient';
import { useI18n } from '../../../lib/i18n';

export default function DashboardBuilderPage() {
  const { t, language } = useI18n();
  const query = useQuery({ queryKey: ['app-dashboard-widgets'], queryFn: listDashboardWidgets });
  const [items, setItems] = useState<DashboardWidget[]>([]);
  const widgetLabels: Record<string, string> = { next_session: t('appBuilder.widgets.nextSession'), active_workout_plan: t('appBuilder.widgets.activeWorkoutPlan'), credit_balance: t('appBuilder.widgets.creditBalance'), body_metric_progress: t('appBuilder.widgets.bodyMetricProgress'), pending_bookings: t('appBuilder.widgets.pendingBookings'), latest_notifications: t('appBuilder.widgets.latestNotifications'), payment_status: t('appBuilder.widgets.paymentStatus'), trainer_message: t('appBuilder.widgets.trainerMessage'), upcoming_work: t('appBuilder.widgets.upcomingWork') };
  useEffect(() => { if (query.data) setItems(query.data.map(item => ({ ...item, label: widgetLabels[item.key] ?? item.label }))); }, [query.data, language]);
  const mutation = useMutation({ mutationFn: () => saveDashboardWidgets(items), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-dashboard-widgets'] }) });
  if (query.isLoading) return <LoadingScreen />;
  return <Stack spacing={2}><AdminPageHeader title={t('appBuilder.dashboard.title')} /><AppBuilderTabs />{query.error && <Alert severity="error">{(query.error as Error).message}</Alert>}{mutation.error && <Alert severity="error">{(mutation.error as Error).message}</Alert>}{mutation.isSuccess && <Alert severity="success">{t('appBuilder.updated')}</Alert>}<Card><CardContent><Stack spacing={2}><SortableWidgetList items={items} onChange={setItems} /><Button variant="contained" onClick={() => mutation.mutate()} disabled={mutation.isPending}>{t('common.save')}</Button></Stack></CardContent></Card></Stack>;
}
