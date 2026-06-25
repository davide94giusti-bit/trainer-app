import { useI18n } from '../../lib/i18n';
import GenericResourcePage from './GenericResourcePage';
export default function ExercisesPage() { const { t } = useI18n(); return <GenericResourcePage title={t('nav.exercises')} table="exercises" columns={['name','category','difficulty','status','created_at']} createPath="/admin/exercises/new" />; }
