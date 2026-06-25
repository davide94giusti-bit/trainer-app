import { useI18n } from '../../lib/i18n';
import GenericResourcePage from './GenericResourcePage';
export default function AuditLogsPage() { const { t } = useI18n(); return <GenericResourcePage title={t('nav.audit')} table="audit_logs" columns={['created_at','actor_user_id','action','entity_table','entity_id']} />; }
