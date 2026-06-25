import { Alert, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { customerSchema } from '../../validation/customer.schemas';
import { createCustomerProfile } from '../../services/customers.service';
import { queryClient } from '../../lib/queryClient';

export default function CreateCustomerPage() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(customerSchema), defaultValues: { email: '', full_name: '', phone: '', objective: '' } });
  const mutation = useMutation({ mutationFn: createCustomerProfile, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-customers'] }); reset(); } });
  return <Stack spacing={2}><Typography variant="h4">Create customer profile</Typography><Alert severity="info">This creates the app profile. For hosted Supabase Auth invitation, use the optional Cloudflare Pages Function or Supabase Auth dashboard as documented.</Alert>{mutation.error && <Alert severity="error">{(mutation.error as Error).message}</Alert>}{mutation.isSuccess && <Alert severity="success">Customer profile created.</Alert>}<Card><CardContent><form onSubmit={handleSubmit(v => mutation.mutate(v))}><TextField label="Email" fullWidth margin="normal" {...register('email')} error={!!errors.email} helperText={errors.email?.message} /><TextField label="Full name" fullWidth margin="normal" {...register('full_name')} error={!!errors.full_name} helperText={errors.full_name?.message} /><TextField label="Phone" fullWidth margin="normal" {...register('phone')} /><TextField label="Objective" fullWidth margin="normal" multiline minRows={3} {...register('objective')} /><Button type="submit" disabled={mutation.isPending}>Create</Button></form></CardContent></Card></Stack>;
}
