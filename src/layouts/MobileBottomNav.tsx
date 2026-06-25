import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SettingsIcon from '@mui/icons-material/Settings';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';

export default function MobileBottomNav() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const items = [
    { label: t('nav.dashboard'), path: '/dashboard', icon: <DashboardIcon /> },
    { label: t('nav.sessions'), path: '/sessions', icon: <CalendarMonthIcon /> },
    { label: t('nav.workout'), path: '/workout-plan', icon: <FitnessCenterIcon /> },
    { label: t('nav.settings'), path: '/settings', icon: <SettingsIcon /> },
  ];
  const value = items.find(i => location.pathname.startsWith(i.path))?.path ?? '/dashboard';
  return <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: { xs: 'block', md: 'none' }, zIndex: 1200 }} elevation={3}><BottomNavigation value={value} onChange={(_, next) => navigate(next)}>{items.map(i => <BottomNavigationAction key={i.path} label={i.label} value={i.path} icon={i.icon} />)}</BottomNavigation></Paper>;
}
