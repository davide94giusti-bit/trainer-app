import { Alert, Button, Card, CardContent, Checkbox, FormControlLabel, MenuItem, Stack, TextField } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import AdminPageHeader from '../../../components/admin/AdminPageHeader';
import AppBuilderTabs from '../../../components/admin/AppBuilderTabs';
import LoadingScreen from '../../../components/LoadingScreen';
import { getLanguageSettings, saveLanguageSettings } from '../../../services/appBuilder.service';
import { queryClient } from '../../../lib/queryClient';
import { useI18n } from '../../../lib/i18n';
import type { Language } from '../../../types/domain';

const languages: Language[] = ['en', 'es', 'it'];

export default function LanguageSettingsPage() {
  const { t } = useI18n();
  const query = useQuery({ queryKey: ['app-language-settings'], queryFn: getLanguageSettings });
  const [defaultLanguage, setDefaultLanguage] = useState<Language>('en');
  const [enabledLanguages, setEnabledLanguages] = useState<Language[]>(languages);
  useEffect(() => { if (query.data) { setDefaultLanguage(query.data.default_language); setEnabledLanguages(query.data.enabled_languages); } }, [query.data]);
  const mutation = useMutation({ mutationFn: () => saveLanguageSettings({ default_language: defaultLanguage, enabled_languages: enabledLanguages }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['app-language-settings'] }) });
  if (query.isLoading) return <LoadingScreen />;
  return <Stack spacing={2}><AdminPageHeader title={t('appBuilder.languages.title')} /><AppBuilderTabs />{query.error && <Alert severity="error">{(query.error as Error).message}</Alert>}{mutation.error && <Alert severity="error">{(mutation.error as Error).message}</Alert>}{mutation.isSuccess && <Alert severity="success">{t('appBuilder.updated')}</Alert>}<Card><CardContent><Stack spacing={2}><TextField select label={t('appBuilder.defaultLanguage')} value={defaultLanguage} onChange={e => setDefaultLanguage(e.target.value as Language)}>{languages.map(language => <MenuItem key={language} value={language}>{language}</MenuItem>)}</TextField><Stack>{languages.map(language => <FormControlLabel key={language} control={<Checkbox checked={enabledLanguages.includes(language)} disabled={enabledLanguages.length === 1 && enabledLanguages.includes(language)} onChange={e => setEnabledLanguages(e.target.checked ? [...enabledLanguages, language] : enabledLanguages.filter(v => v !== language))} />} label={language} />)}</Stack><Button variant="contained" onClick={() => mutation.mutate()} disabled={mutation.isPending}>{t('common.save')}</Button></Stack></CardContent></Card></Stack>;
}
