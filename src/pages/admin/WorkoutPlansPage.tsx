import { useI18n } from '../../lib/i18n';
import GenericResourcePage from './GenericResourcePage';
export default function WorkoutPlansPage() { const { t } = useI18n(); return <GenericResourcePage title={t('nav.workoutPlans')} table="workout_plans" columns={['title','status','customer_user_id','created_at']} createPath="/admin/workout-plans/new" />; }
