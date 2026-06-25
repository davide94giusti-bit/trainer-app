import GenericResourcePage from './GenericResourcePage';
export default function ExercisesPage() { return <GenericResourcePage title="Exercises" table="exercises" columns={['name','category','difficulty','status','created_at']} createPath="/admin/exercises/new" />; }
