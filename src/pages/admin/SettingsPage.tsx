import { useI18n } from '../../lib/i18n';
import GenericResourcePage from './GenericResourcePage';
export default function AdminSettingsPage() { const { t } = useI18n(); return <GenericResourcePage title={t('nav.settings')} table="app_settings" columns={['key','value','updated_at']} />; }
