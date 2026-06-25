import { Alert, Button, Card, CardContent, Stack } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import AdminPageHeader from '../../../components/admin/AdminPageHeader';
import AppBuilderTabs from '../../../components/admin/AppBuilderTabs';
import SortableWidgetList from '../../../components/admin/SortableWidgetList';
import LoadingScreen from '../../../components/LoadingScreen';
import { listNavigationItems, saveNavigationItems, type NavigationItem } from '../../../services/appBuilder.service';
import { queryClient } from '../../../lib/queryClient';
import { useI18n } from '../../../lib/i18n';

export default function NavigationBuilderPage() {
  const { t, language } = useI18n();
  const query = useQuery({ queryKey: ['app-navigation-items'], queryFn: listNavigationItems });
  const [items, setItems] = useState<NavigationItem[]>([]);
  const navLabels: Record<string, string> = { dashboard: t('appBuilder.nav.dashboard'), sessions: t('appBuilder.nav.sessions'), workout_plan: t('appBuilder.nav.workoutPlan'), availability: t('appBuilder.nav.availability'), payments: t('appBuilder.nav.payments'), notifications: t('appBuilder.nav.notifications'), settings: t('appBuilder.nav.settings'), metrics: t('appBuilder.nav.metrics') };
  useEffect(() => { if (query.data) setItems(query.data.map(item => ({ ...item, label: navLabels[item.key] ?? item.label }))); }, [query.data, language]);
  const mutation = useMutation({ mutationFn: () => saveNavigationItems(items), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-navigation-items'] }) });
  if (query.isLoading) return <LoadingScreen />;
  return <Stack spacing={2}><AdminPageHeader title={t('appBuilder.navigation.title')} /><AppBuilderTabs />{query.error && <Alert severity="error">{(query.error as Error).message}</Alert>}{mutation.error && <Alert severity="error">{(mutation.error as Error).message}</Alert>}{mutation.isSuccess && <Alert severity="success">{t('appBuilder.updated')}</Alert>}<Card><CardContent><Stack spacing={2}><SortableWidgetList items={items} onChange={next => setItems(next as NavigationItem[])} /><Button variant="contained" onClick={() => mutation.mutate()} disabled={mutation.isPending}>{t('common.save')}</Button></Stack></CardContent></Card></Stack>;
}
