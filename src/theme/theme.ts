import { createTheme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';

export function createAppTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: '#2563eb' },
      secondary: { main: '#16a34a' },
      background: mode === 'dark' ? { default: '#0f172a', paper: '#111827' } : { default: '#f8fafc', paper: '#ffffff' },
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: ['Roboto', 'Arial', 'sans-serif'].join(','),
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
    },
    components: {
      MuiCard: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiButton: { defaultProps: { variant: 'contained' } },
    },
  });
}
