import { useI18n } from '../../lib/i18n';
import GenericResourcePage from './GenericResourcePage';
export default function AdminSessionsPage() { const { t } = useI18n(); return <GenericResourcePage title={t('nav.sessions')} table="sessions" columns={['start_at','end_at','focus_area','session_type','status','customer_user_id']} />; }
