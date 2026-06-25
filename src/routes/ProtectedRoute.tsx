import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import { getMyProfile } from '../services/profiles.service';

export default function ProtectedRoute() {
  const location = useLocation();
  const profile = useQuery({ queryKey: ['my-profile'], queryFn: getMyProfile });
  if (profile.isLoading) return <LoadingScreen />;
  if (!profile.data) return <Navigate to="/login" state={{ from: location }} replace />;
  if (profile.data.status === 'deactivated') return <Navigate to="/login?error=deactivated" replace />;
  return <Outlet />;
}
