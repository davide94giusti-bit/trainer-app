import { useI18n } from '../../lib/i18n';
import GenericResourcePage from './GenericResourcePage';
export default function PackagesPage() { const { t } = useI18n(); return <GenericResourcePage title={t('nav.packages')} table="packages" columns={['name','credit_quantity','price','currency','status','created_at']} />; }
