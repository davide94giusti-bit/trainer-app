import type React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../src/pages/LoginPage';
import { I18nProvider } from '../src/lib/i18n';
import { AppThemeProvider } from '../src/theme/ThemeProvider';

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>
        <AppThemeProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </AppThemeProvider>
      </I18nProvider>
    </QueryClientProvider>,
  );
}

describe('smoke tests', () => {
  it('renders the login page', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
});
