import { Alert, Card, CardContent, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import { supabase } from '../lib/supabase';
import { localized } from '../lib/format';

export default function ExerciseDetailPage() {
  const { id } = useParams();
  const query = useQuery({ queryKey: ['exercise', id], queryFn: async () => { const { data, error } = await supabase.from('exercises').select('*, exercise_media(*)').eq('id', id).single(); if (error) throw error; return data; }, enabled: !!id });
  if (query.isLoading) return <LoadingScreen />;
  if (query.error) return <Alert severity="error">{(query.error as Error).message}</Alert>;
  const e: any = query.data;
  return <Stack spacing={2}><Card><CardContent><Typography variant="h4">{localized(e.name)}</Typography><Typography>{localized(e.description)}</Typography><Typography color="text.secondary">Difficulty: {e.difficulty}</Typography><Typography color="text.secondary">Muscles: {(e.muscles ?? []).join(', ')}</Typography></CardContent></Card></Stack>;
}
