import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { updatePassword } from '../services/auth.service';
import { updateMyProfile } from '../services/profiles.service';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';

export default function AcceptInvitePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  return <Box minHeight="100vh" display="grid" alignItems="center" justifyContent="center" p={2}><Card sx={{ width: 460, maxWidth: '100%' }}><CardContent><Stack spacing={2}><Typography variant="h5">{t('auth.acceptInvitation')}</Typography><Alert severity="info">{t('auth.inviteInfo')}</Alert>{error && <Alert severity="error">{error}</Alert>}<TextField label={t('common.fullName')} value={fullName} onChange={e => setFullName(e.target.value)} /><TextField label={t('auth.password')} type="password" value={password} onChange={e => setPassword(e.target.value)} /><Button variant="contained" onClick={async () => { try { await updatePassword(password); await updateMyProfile({ full_name: fullName }); navigate('/dashboard'); } catch (e: any) { setError(e.message); } }}>{t('auth.activateAccount')}</Button></Stack></CardContent></Card></Box>;
}
