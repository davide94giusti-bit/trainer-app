import GenericResourcePage from './GenericResourcePage';
export default function AuditLogsPage() { return <GenericResourcePage title="Audit logs" table="audit_logs" columns={['created_at','actor_user_id','action','entity_table','entity_id']} />; }
