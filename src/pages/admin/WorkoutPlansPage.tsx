import GenericResourcePage from './GenericResourcePage';
export default function WorkoutPlansPage() { return <GenericResourcePage title="Workout plans" table="workout_plans" columns={['title','status','customer_user_id','created_at']} createPath="/admin/workout-plans/new" />; }
