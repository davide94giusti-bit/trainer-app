import { Tab, Tabs } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../../lib/i18n';

export default function AppBuilderTabs() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = [
    ['/admin/app-builder/branding', t('nav.branding')],
    ['/admin/app-builder/dashboard', t('nav.dashboard')],
    ['/admin/app-builder/content', t('nav.content')],
    ['/admin/app-builder/navigation', t('nav.navigation')],
    ['/admin/app-builder/policies', t('nav.policies')],
    ['/admin/app-builder/languages', t('nav.languages')],
    ['/admin/app-builder/features', t('nav.features')],
    ['/admin/app-builder/preview', t('app.preview')],
  ];
  const value = tabs.some(([path]) => path === location.pathname) ? location.pathname : false;
  return <Tabs value={value} onChange={(_, value) => navigate(value)} variant="scrollable" scrollButtons="auto">{tabs.map(([path, label]) => <Tab key={path} label={label} value={path} />)}</Tabs>;
}
