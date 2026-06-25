import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { PaletteMode } from '@mui/material';
import { createAppTheme } from './theme';
import type { ThemePreference } from '../types/domain';

const ThemePreferenceContext = createContext<{ preference: ThemePreference; setPreference: (next: ThemePreference) => void } | undefined>(undefined);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [preference, setPreferenceState] = useState<ThemePreference>((localStorage.getItem('trainer.theme') as ThemePreference | null) ?? 'system');
  const mode: PaletteMode = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  useEffect(() => {
    localStorage.setItem('trainer.theme', preference);
  }, [preference]);

  const value = useMemo(() => ({ preference, setPreference: setPreferenceState }), [preference]);

  return (
    <ThemePreferenceContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) throw new Error('useThemePreference must be used inside AppThemeProvider');
  return ctx;
}
