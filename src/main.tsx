import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { queryClient } from './lib/queryClient';
import { I18nProvider } from './lib/i18n';
import { AppThemeProvider } from './theme/ThemeProvider';
import { router } from './routes/router';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AppThemeProvider>
          <CssBaseline />
          <RouterProvider router={router} />
        </AppThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
