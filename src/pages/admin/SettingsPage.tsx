import GenericResourcePage from './GenericResourcePage';
export default function AdminSettingsPage() { return <GenericResourcePage title="App settings" table="app_settings" columns={['key','value','updated_at']} />; }
