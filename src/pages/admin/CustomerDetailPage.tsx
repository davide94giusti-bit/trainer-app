import { Alert, Button, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import LoadingScreen from '../../components/LoadingScreen';
import { supabase } from '../../lib/supabase';
import { deactivateCustomer, reactivateCustomer } from '../../services/customers.service';
import { getCustomerCreditBalance } from '../../services/credits.service';
import { queryClient } from '../../lib/queryClient';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const profile = useQuery({ queryKey: ['customer', id], queryFn: async () => { const { data, error } = await supabase.from('profiles').select('*, customer_profiles(*)').eq('id', id).single(); if (error) throw error; return data; }, enabled: !!id });
  const credits = useQuery({ queryKey: ['customer-credits', id], queryFn: () => getCustomerCreditBalance(id!), enabled: !!id });
  const deactivate = useMutation({ mutationFn: () => deactivateCustomer(id!), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer', id] }) });
  const reactivate = useMutation({ mutationFn: () => reactivateCustomer(id!), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer', id] }) });
  if (profile.isLoading) return <LoadingScreen />;
  if (profile.error) return <Alert severity="error">{(profile.error as Error).message}</Alert>;
  const customer: any = profile.data;
  return <Stack spacing={2}><Typography variant="h4">{customer.full_name ?? customer.email}</Typography><Grid container spacing={2}><Grid item xs={12} md={6}><Card><CardContent><Typography variant="h6">Profile</Typography><Typography>Email: {customer.email}</Typography><Typography>Phone: {customer.phone ?? '-'}</Typography><Typography>Status: {customer.status}</Typography><Typography>Objective: {customer.customer_profiles?.objective ?? '-'}</Typography></CardContent></Card></Grid><Grid item xs={12} md={6}><Card><CardContent><Typography variant="h6">Credits</Typography><Typography variant="h3">{credits.data ?? '-'}</Typography><Stack direction="row" spacing={1} mt={2}><Button color="error" disabled={customer.status === 'deactivated'} onClick={() => deactivate.mutate()}>Deactivate</Button><Button color="success" disabled={customer.status === 'active'} onClick={() => reactivate.mutate()}>Reactivate</Button></Stack></CardContent></Card></Grid></Grid></Stack>;
}
