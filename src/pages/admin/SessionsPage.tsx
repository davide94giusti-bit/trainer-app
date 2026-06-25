import GenericResourcePage from './GenericResourcePage';
export default function AdminSessionsPage() { return <GenericResourcePage title="Sessions" table="sessions" columns={['start_at','end_at','session_type','status','customer_user_id']} />; }
