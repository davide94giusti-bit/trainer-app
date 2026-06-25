import { Card, CardActionArea, CardContent, Grid, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AdminPageHeader from '../../../components/admin/AdminPageHeader';
import { useI18n } from '../../../lib/i18n';

export default function AppBuilderPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const sections = [
    ['/admin/website-edit', t('websiteEdit.title')],
    ['/admin/app-builder/branding', t('appBuilder.branding.title')],
    ['/admin/app-builder/dashboard', t('appBuilder.dashboard.title')],
    ['/admin/app-builder/content', t('appBuilder.content.title')],
    ['/admin/app-builder/navigation', t('appBuilder.navigation.title')],
    ['/admin/app-builder/policies', t('appBuilder.policies.title')],
    ['/admin/app-builder/languages', t('appBuilder.languages.title')],
    ['/admin/app-builder/features', t('appBuilder.features.title')],
    ['/admin/app-builder/preview', t('appBuilder.preview.title')],
  ];
  return <Stack spacing={2}><AdminPageHeader title={t('appBuilder.title')} subtitle={t('appBuilder.subtitle')} /><Grid container spacing={2}>{sections.map(([path, title]) => <Grid item xs={12} sm={6} md={3} key={path}><Card><CardActionArea onClick={() => navigate(path)}><CardContent><Typography variant="h6">{title}</Typography></CardContent></CardActionArea></Card></Grid>)}</Grid></Stack>;
}
