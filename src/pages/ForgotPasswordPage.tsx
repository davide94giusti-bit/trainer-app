import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emailSchema } from '../validation/auth.schemas';
import { sendPasswordReset } from '../services/auth.service';
import { useState } from 'react';
import { useI18n } from '../lib/i18n';

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(emailSchema), defaultValues: { email: '' } });
  return <Box minHeight="100vh" display="grid" alignItems="center" justifyContent="center" p={2}><Card sx={{ width: 420, maxWidth: '100%' }}><CardContent><Stack spacing={2}><Typography variant="h5">{t('auth.passwordReset')}</Typography>{sent && <Alert severity="success">{t('auth.checkEmail')}</Alert>}{error && <Alert severity="error">{error}</Alert>}<form onSubmit={handleSubmit(async v => { try { await sendPasswordReset(v.email); setSent(true); } catch (e: any) { setError(e.message); } })}><TextField label={t('auth.email')} fullWidth margin="normal" {...register('email')} error={!!errors.email} helperText={errors.email?.message} /><Button fullWidth type="submit" disabled={isSubmitting}>{t('auth.sendResetLink')}</Button></form></Stack></CardContent></Card></Box>;
}
