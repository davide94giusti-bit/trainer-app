import { Grid, TextField } from '@mui/material';
import { useI18n } from '../../lib/i18n';
import type { Language } from '../../types/domain';

type Value = Record<Language, string>;

export default function LocalizedJsonEditor({ value, onChange, label, multiline = true }: { value: Value; onChange: (value: Value) => void; label?: string; multiline?: boolean }) {
  const { t } = useI18n();
  const labels: Record<Language, string> = { en: t('appBuilder.english'), es: t('appBuilder.spanish'), it: t('appBuilder.italian') };
  return <Grid container spacing={2}>{(['en', 'es', 'it'] as Language[]).map(language => <Grid item xs={12} md={4} key={language}><TextField fullWidth label={`${label ?? t('appBuilder.localizedValue')} - ${labels[language]}`} value={value?.[language] ?? ''} multiline={multiline} minRows={multiline ? 3 : undefined} onChange={event => onChange({ ...value, [language]: event.target.value })} /></Grid>)}</Grid>;
}
