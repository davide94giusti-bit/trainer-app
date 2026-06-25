import { Alert, Button, Card, CardContent, Stack, TextField } from '@mui/material';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { createAdminAnnouncement } from '../../services/notifications.service';
import { useI18n } from '../../lib/i18n';

export default function AdminNotificationsPage() {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const mutation = useMutation({ mutationFn: () => createAdminAnnouncement(title, message, 'all') });
  return <Stack spacing={2}><AdminPageHeader title={t('nav.notifications')} />{mutation.error && <Alert severity="error">{(mutation.error as Error).message}</Alert>}{mutation.isSuccess && <Alert severity="success">{t('admin.notifications.queued')}</Alert>}<Card><CardContent><Stack spacing={2}><TextField label={t('common.title')} value={title} onChange={e => setTitle(e.target.value)} /><TextField label={t('common.message')} multiline minRows={4} value={message} onChange={e => setMessage(e.target.value)} /><Button variant="contained" onClick={() => mutation.mutate()} disabled={!title || !message}>{t('admin.notifications.sendAnnouncement')}</Button></Stack></CardContent></Card></Stack>;
}
