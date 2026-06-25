import GenericResourcePage from './GenericResourcePage';
export default function PackagesPage() { return <GenericResourcePage title="Packages" table="packages" columns={['name','credit_quantity','price','currency','status','created_at']} />; }
