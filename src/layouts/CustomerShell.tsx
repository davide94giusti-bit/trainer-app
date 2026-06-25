import { AppBar, Box, Button, Container, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import PaymentsIcon from '@mui/icons-material/Payments';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import MobileBottomNav from './MobileBottomNav';
import { getMyProfile } from '../services/profiles.service';
import { signOut } from '../services/auth.service';
import { queryClient } from '../lib/queryClient';
import { useI18n } from '../lib/i18n';

const drawerWidth = 260;

export default function CustomerShell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const profile = useQuery({ queryKey: ['my-profile'], queryFn: getMyProfile });
  const nav = [
    { label: t('nav.dashboard'), path: '/dashboard', icon: <DashboardIcon /> },
    { label: t('nav.sessions'), path: '/sessions', icon: <CalendarMonthIcon /> },
    { label: t('nav.workout'), path: '/workout-plan', icon: <FitnessCenterIcon /> },
    { label: t('nav.metrics'), path: '/metrics', icon: <MonitorHeartIcon /> },
    { label: t('nav.availability'), path: '/availability', icon: <CalendarMonthIcon /> },
    { label: t('nav.payments'), path: '/payments', icon: <PaymentsIcon /> },
    { label: t('nav.notifications'), path: '/notifications', icon: <NotificationsIcon /> },
    { label: t('nav.settings'), path: '/settings', icon: <SettingsIcon /> },
  ];

  const content = (
    <Box sx={{ width: drawerWidth }} role="presentation">
      <Toolbar><Typography variant="h6">{t('app.customerApp')}</Typography></Toolbar>
      <Divider />
      <List>{nav.map(item => <ListItemButton key={item.path} selected={location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)} onClick={() => { navigate(item.path); setOpen(false); }}><ListItemIcon>{item.icon}</ListItemIcon><ListItemText primary={item.label} /></ListItemButton>)}</List>
      <Divider />
      <Box p={2}><Typography variant="body2" color="text.secondary">{profile.data?.full_name ?? profile.data?.email}</Typography><Button sx={{ mt: 1 }} fullWidth variant="outlined" onClick={async () => { await signOut(); queryClient.clear(); navigate('/login'); }}>{t('auth.logout')}</Button></Box>
    </Box>
  );

  return <Box sx={{ display: 'flex' }}><AppBar position="fixed" sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}><Toolbar><IconButton color="inherit" edge="start" onClick={() => setOpen(true)} sx={{ mr: 2, display: { md: 'none' } }}><MenuIcon /></IconButton><Typography variant="h6" sx={{ flexGrow: 1 }}>{t('app.title')}</Typography></Toolbar></AppBar><Drawer variant="temporary" open={open} onClose={() => setOpen(false)} sx={{ display: { xs: 'block', md: 'none' } }}>{content}</Drawer><Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }} open>{content}</Drawer><Box component="main" sx={{ flexGrow: 1, pb: { xs: 9, md: 3 } }}><Toolbar /><Container maxWidth="xl" sx={{ py: 3 }}><Outlet /></Container></Box><MobileBottomNav /></Box>;
}
