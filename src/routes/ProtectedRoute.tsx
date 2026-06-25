import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import LoadingScreen from '../components/LoadingScreen';
import { getMyProfile } from '../services/profiles.service';
import { useI18n } from '../lib/i18n';
import { useThemePreference } from '../theme/ThemeProvider';

export default function ProtectedRoute() {
  const location = useLocation();
  const { setLanguage } = useI18n();
  const { setPreference } = useThemePreference();
  const profile = useQuery({ queryKey: ['my-profile'], queryFn: getMyProfile });
  useEffect(() => { if (profile.data?.language) setLanguage(profile.data.language); }, [profile.data?.language, setLanguage]);
  useEffect(() => { if (profile.data?.theme) setPreference(profile.data.theme); }, [profile.data?.theme, setPreference]);
  if (profile.isLoading) return <LoadingScreen />;
  if (!profile.data) return <Navigate to="/login" state={{ from: location }} replace />;
  if (profile.data.status === 'deactivated') return <Navigate to="/login?error=deactivated" replace />;
  return <Outlet />;
}
