import { Navigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import { getMyProfile } from '../services/profiles.service';
import { isAdmin } from '../lib/permissions';

export default function AdminRoute() {
  const profile = useQuery({ queryKey: ['my-profile'], queryFn: getMyProfile });
  if (profile.isLoading) return <LoadingScreen />;
  if (!isAdmin(profile.data)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
