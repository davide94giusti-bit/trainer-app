import { Navigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import { getMyProfile } from '../services/profiles.service';
import { isAdmin, isCustomer } from '../lib/permissions';

export default function CustomerRoute() {
  const profile = useQuery({ queryKey: ['my-profile'], queryFn: getMyProfile });

  if (profile.isLoading) return <LoadingScreen />;

  if (!profile.data) {
    return <Navigate to="/login" replace />;
  }

  if (isCustomer(profile.data)) {
    return <Outlet />;
  }

  if (isAdmin(profile.data)) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/login?error=inactive-profile" replace />;
}