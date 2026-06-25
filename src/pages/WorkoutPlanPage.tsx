import { Alert, Card, CardContent, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import DataTable from '../components/DataTable';
import { getMyActiveWorkoutPlan } from '../services/workoutPlans.service';
import { localized } from '../lib/format';

export default function WorkoutPlanPage() {
  const query = useQuery({ queryKey: ['my-workout-plan'], queryFn: getMyActiveWorkoutPlan });
  if (query.isLoading) return <LoadingScreen />;
  if (query.error) return <Alert severity="error">{(query.error as Error).message}</Alert>;
  const plan: any = query.data;
  if (!plan) return <Alert severity="info">No active workout plan assigned yet.</Alert>;
  return <Stack spacing={2}><Card><CardContent><Typography variant="h4">{localized(plan.title)}</Typography><Typography color="text.secondary">{localized(plan.description)}</Typography></CardContent></Card><DataTable rows={plan.workout_plan_exercises ?? []} columns={[{ key: 'exercise', header: 'Exercise', render: r => localized(r.exercises?.name) }, { key: 'sets', header: 'Sets' }, { key: 'reps', header: 'Reps' }, { key: 'rest_seconds', header: 'Rest' }, { key: 'notes', header: 'Notes' }]} /></Stack>;
}
