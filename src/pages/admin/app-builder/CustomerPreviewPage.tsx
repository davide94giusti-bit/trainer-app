import { Alert, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import AdminPageHeader from '../../../components/admin/AdminPageHeader';
import AppBuilderTabs from '../../../components/admin/AppBuilderTabs';
import LoadingScreen from '../../../components/LoadingScreen';
import { getBrandingSettings, listDashboardWidgets } from '../../../services/appBuilder.service';
import { useI18n } from '../../../lib/i18n';

export default function CustomerPreviewPage() {
  const { t, language } = useI18n();
  const branding = useQuery({ queryKey: ['app-branding'], queryFn: getBrandingSettings });
  const widgets = useQuery({ queryKey: ['app-dashboard-widgets'], queryFn: listDashboardWidgets });
  if (branding.isLoading || widgets.isLoading) return <LoadingScreen />;
  if (branding.error) return <Alert severity="error">{(branding.error as Error).message}</Alert>;
  return <Stack spacing={2}><AdminPageHeader title={t('appBuilder.preview.title')} subtitle={t('appBuilder.previewNotice')} /><AppBuilderTabs /><Card><CardContent><Stack spacing={2}><Typography variant="h4">{branding.data?.login_title?.[language] ?? branding.data?.app_name}</Typography><Typography color="text.secondary">{branding.data?.login_subtitle?.[language]}</Typography><Grid container spacing={2}>{(widgets.data ?? []).filter(w => w.enabled).sort((a,b) => a.sort_order - b.sort_order).map(widget => <Grid item xs={12} md={4} key={widget.key}><Card variant="outlined"><CardContent><Typography variant="h6">{widget.label}</Typography><Typography color="text.secondary">{widget.key}</Typography></CardContent></Card></Grid>)}</Grid></Stack></CardContent></Card></Stack>;
}
