import { Alert, Box, Button, Card, CardContent, Link, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../validation/auth.schemas';
import { signInWithPassword } from '../services/auth.service';
import { getMyProfile } from '../services/profiles.service';
import { useState } from 'react';
import { useI18n } from '../lib/i18n';

export default function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(params.get('error') === 'deactivated' ? 'Your account is deactivated.' : null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  return <Box minHeight="100vh" display="grid" alignItems="center" justifyContent="center" p={2}><Card sx={{ width: 420, maxWidth: '100%' }}><CardContent><Stack spacing={2}><Typography variant="h4">{t('auth.login')}</Typography>{error && <Alert severity="error">{error}</Alert>}<form onSubmit={handleSubmit(async values => { try { await signInWithPassword(values.email, values.password); const profile = await getMyProfile(); navigate(profile?.role === 'admin' ? '/admin' : '/dashboard'); } catch (e: any) { setError(e.message); } })}><TextField label={t('auth.email')} fullWidth margin="normal" {...register('email')} error={!!errors.email} helperText={errors.email?.message} /><TextField label={t('auth.password')} type="password" fullWidth margin="normal" {...register('password')} error={!!errors.password} helperText={errors.password?.message} /><Button fullWidth type="submit" disabled={isSubmitting} sx={{ mt: 2 }}>{t('auth.login')}</Button></form><Link component={RouterLink} to="/forgot-password">{t('auth.forgot')}</Link></Stack></CardContent></Card></Box>;
}
