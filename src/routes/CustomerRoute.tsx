import { Navigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import { getMyProfile } from '../services/profiles.service';

export default function CustomerRoute() {
  const profile = useQuery({ queryKey: ['my-profile'], queryFn: getMyProfile });
  if (profile.isLoading) return <LoadingScreen />;
  if (!profile.data) return <Navigate to="/login" replace />;
  if (profile.data.role !== 'customer' || profile.data.status !== 'active') return <Navigate to="/admin" replace />;
  return <Outlet />;
}
