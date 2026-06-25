import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { updatePassword } from '../services/auth.service';
import { updateMyProfile } from '../services/profiles.service';
import { useNavigate } from 'react-router-dom';

export default function AcceptInvitePage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  return <Box minHeight="100vh" display="grid" alignItems="center" justifyContent="center" p={2}><Card sx={{ width: 460, maxWidth: '100%' }}><CardContent><Stack spacing={2}><Typography variant="h5">Accept invitation</Typography><Alert severity="info">Open this page from the Supabase invitation email, then set your first password.</Alert>{error && <Alert severity="error">{error}</Alert>}<TextField label="Full name" value={fullName} onChange={e => setFullName(e.target.value)} /><TextField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} /><Button onClick={async () => { try { await updatePassword(password); await updateMyProfile({ full_name: fullName }); navigate('/dashboard'); } catch (e: any) { setError(e.message); } }}>Activate account</Button></Stack></CardContent></Card></Box>;
}
