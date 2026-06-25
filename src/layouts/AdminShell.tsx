import { AppBar, Avatar, Box, Button, Chip, Container, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Stack, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PaymentsIcon from '@mui/icons-material/Payments';
import InventoryIcon from '@mui/icons-material/Inventory';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HistoryIcon from '@mui/icons-material/History';
import WebIcon from '@mui/icons-material/Web';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { signOut } from '../services/auth.service';
import { getMyProfile } from '../services/profiles.service';
import { queryClient } from '../lib/queryClient';
import { useI18n } from '../lib/i18n';

const drawerWidth = 292;

export default function AdminShell() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const profile = useQuery({ queryKey: ['my-profile'], queryFn: getMyProfile });

  const nav = [
    { label: t('nav.dashboard'), path: '/admin', icon: <DashboardIcon /> },
    { label: t('nav.customers'), path: '/admin/customers', icon: <PeopleIcon /> },
    { label: t('nav.admins'), path: '/admin/admins', icon: <AdminPanelSettingsIcon /> },
    { label: t('nav.appBuilder'), path: '/admin/app-builder', icon: <WebIcon /> },
    { label: t('nav.exercises'), path: '/admin/exercises', icon: <FitnessCenterIcon /> },
    { label: t('nav.workoutPlans'), path: '/admin/workout-plans', icon: <AssignmentIcon /> },
    { label: t('nav.sessions'), path: '/admin/sessions', icon: <CalendarMonthIcon /> },
    { label: t('nav.bookings'), path: '/admin/bookings', icon: <EventAvailableIcon /> },
    { label: t('nav.payments'), path: '/admin/payments', icon: <PaymentsIcon /> },
    { label: t('nav.packages'), path: '/admin/packages', icon: <InventoryIcon /> },
    { label: t('nav.settings'), path: '/admin/settings', icon: <SettingsIcon /> },
    { label: t('nav.notifications'), path: '/admin/notifications', icon: <NotificationsIcon /> },
    { label: t('nav.audit'), path: '/admin/audit-logs', icon: <HistoryIcon /> },
  ];

  const isSelected = (path: string) => path === '/admin' ? location.pathname === '/admin' : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const drawer = (
    <Box sx={{ width: drawerWidth, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ alignItems: 'flex-start', flexDirection: 'column', py: 2 }}>
        <Typography variant="h6">{t('app.adminConsole')}</Typography>
        <Typography variant="caption" color="text.secondary">{t('app.title')}</Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {nav.map(item => (
          <ListItemButton key={item.path} selected={isSelected(item.path)} onClick={() => { navigate(item.path); setOpen(false); }}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box p={2}>
        <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
          <Avatar>{(profile.data?.full_name ?? profile.data?.email ?? 'A').slice(0, 1).toUpperCase()}</Avatar>
          <Box minWidth={0}>
            <Typography variant="body2" noWrap>{profile.data?.full_name ?? profile.data?.email}</Typography>
            <Chip size="small" label={t('nav.admin')} color="primary" />
          </Box>
        </Stack>
        <Button fullWidth variant="outlined" onClick={async () => { await signOut(); queryClient.clear(); navigate('/login'); }}>{t('auth.logout')}</Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" color="inherit" elevation={1} sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => setOpen(true)} sx={{ mr: 2, display: { md: 'none' } }}><MenuIcon /></IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>{t('app.adminConsole')}</Typography>
          <Chip label={t('nav.admin')} color="primary" size="small" sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>{profile.data?.full_name ?? profile.data?.email}</Typography>
        </Toolbar>
      </AppBar>
      <Drawer variant="temporary" open={open} onClose={() => setOpen(false)} sx={{ display: { xs: 'block', md: 'none' } }}>{drawer}</Drawer>
      <Drawer variant="permanent" open sx={{ display: { xs: 'none', md: 'block' }, width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}>{drawer}</Drawer>
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Toolbar />
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
