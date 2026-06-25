import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema } from '../validation/auth.schemas';
import { updatePassword } from '../services/auth.service';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: '', confirmPassword: '' } });
  return <Box minHeight="100vh" display="grid" alignItems="center" justifyContent="center" p={2}><Card sx={{ width: 420, maxWidth: '100%' }}><CardContent><Stack spacing={2}><Typography variant="h5">Set new password</Typography>{error && <Alert severity="error">{error}</Alert>}<form onSubmit={handleSubmit(async v => { try { await updatePassword(v.password); navigate('/dashboard'); } catch (e: any) { setError(e.message); } })}><TextField label="New password" type="password" fullWidth margin="normal" {...register('password')} error={!!errors.password} helperText={errors.password?.message} /><TextField label="Confirm password" type="password" fullWidth margin="normal" {...register('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} /><Button fullWidth type="submit" disabled={isSubmitting}>Update password</Button></form></Stack></CardContent></Card></Box>;
}
