import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { Link, Outlet } from 'react-router-dom';

const links = [
  ['/admin', 'Dashboard'], ['/admin/customers', 'Customers'], ['/admin/exercises', 'Exercises'], ['/admin/workout-plans', 'Workout Plans'], ['/admin/sessions', 'Sessions'], ['/admin/bookings', 'Bookings'], ['/admin/payments', 'Payments'], ['/admin/packages', 'Packages'], ['/admin/settings', 'Settings'], ['/admin/notifications', 'Notifications'], ['/admin/audit-logs', 'Audit Logs'],
];

export default function AdminShell() {
  return <Stack spacing={3}><Card><CardContent><Typography variant="h5" gutterBottom>Admin console</Typography><Box display="flex" flexWrap="wrap" gap={1}>{links.map(([to, label]) => <Button key={to} component={Link} to={to} variant="outlined" size="small">{label}</Button>)}</Box></CardContent></Card><Outlet /></Stack>;
}
