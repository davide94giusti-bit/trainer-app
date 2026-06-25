import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import { getMyProfile } from '../services/profiles.service';

export default function RoleRedirect() {
  const profile = useQuery({ queryKey: ['my-profile'], queryFn: getMyProfile });
  if (profile.isLoading) return <LoadingScreen />;
  if (!profile.data) return <Navigate to="/login" replace />;
  if (profile.data.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}
