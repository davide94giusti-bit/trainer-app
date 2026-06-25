import { Alert, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import UserStatusActions from '../../components/admin/UserStatusActions';
import LoadingScreen from '../../components/LoadingScreen';
import StatusChip from '../../components/StatusChip';
import { supabase } from '../../lib/supabase';
import { getCustomerCreditBalance } from '../../services/credits.service';
import { useI18n } from '../../lib/i18n';

export default function CustomerDetailPage() {
  const { t } = useI18n();
  const { id } = useParams();
  const profile = useQuery({ queryKey: ['customer', id], queryFn: async () => { const { data, error } = await supabase.from('profiles').select('*, customer_profiles(*)').eq('id', id).single(); if (error) throw error; return data; }, enabled: !!id });
  const credits = useQuery({ queryKey: ['customer-credits', id], queryFn: () => getCustomerCreditBalance(id!), enabled: !!id });
  if (profile.isLoading) return <LoadingScreen />;
  if (profile.error) return <Alert severity="error">{(profile.error as Error).message}</Alert>;
  const customer: any = profile.data;
  return <Stack spacing={2}><AdminPageHeader title={customer.full_name ?? customer.email ?? t('admin.user.detailTitle')} /><Grid container spacing={2}><Grid item xs={12} md={6}><Card><CardContent><Stack spacing={1}><Typography variant="h6">{t('admin.user.profile')}</Typography><Typography>{t('common.email')}: {customer.email}</Typography><Typography>{t('common.phone')}: {customer.phone ?? '-'}</Typography><Typography>{t('common.status')}: <StatusChip status={customer.status} /></Typography><Typography>{t('common.objective')}: {customer.customer_profiles?.objective ?? '-'}</Typography><UserStatusActions userId={customer.id} status={customer.status} invalidateKey={['customer', id]} /></Stack></CardContent></Card></Grid><Grid item xs={12} md={6}><Card><CardContent><Typography variant="h6">{t('admin.user.credits')}</Typography><Typography variant="h3">{credits.data ?? '-'}</Typography></CardContent></Card></Grid></Grid></Stack>;
}
