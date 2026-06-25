import { Alert, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createExercise } from '../../services/exercises.service';
import { useI18n } from '../../lib/i18n';

export default function ExerciseEditorPage() {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: '', category: '', difficulty: 'beginner' });
  const mutation = useMutation({ mutationFn: () => createExercise({ name: { en: form.name, es: form.name, it: form.name }, description: { en: '', es: '', it: '' }, category: form.category, difficulty: form.difficulty, status: 'active' }) });
  return <Stack spacing={2}><Typography variant="h4">{t('admin.exerciseEditor')}</Typography>{mutation.error && <Alert severity="error">{(mutation.error as Error).message}</Alert>}{mutation.isSuccess && <Alert severity="success">{t('common.success')}</Alert>}<Card><CardContent><Stack spacing={2}><TextField label={t('common.name')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /><TextField label={t('common.category')} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /><TextField select label={t('common.difficulty')} value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>{['beginner','intermediate','advanced'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField><Button variant="contained" onClick={() => mutation.mutate()}>{t('admin.saveExercise')}</Button></Stack></CardContent></Card></Stack>;
}
