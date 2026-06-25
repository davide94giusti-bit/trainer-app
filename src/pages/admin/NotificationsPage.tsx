import { Alert, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createAdminAnnouncement } from '../../services/notifications.service';

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const mutation = useMutation({ mutationFn: () => createAdminAnnouncement(title, message, 'all') });
  return <Stack spacing={2}><Typography variant="h4">Notifications</Typography>{mutation.error && <Alert severity="error">{(mutation.error as Error).message}</Alert>}{mutation.isSuccess && <Alert severity="success">Announcement queued.</Alert>}<Card><CardContent><Stack spacing={2}><TextField label="Title" value={title} onChange={e => setTitle(e.target.value)} /><TextField label="Message" multiline minRows={4} value={message} onChange={e => setMessage(e.target.value)} /><Button onClick={() => mutation.mutate()} disabled={!title || !message}>Send announcement</Button></Stack></CardContent></Card></Stack>;
}
