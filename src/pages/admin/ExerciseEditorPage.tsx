import { Alert, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createExercise } from '../../services/exercises.service';

export default function ExerciseEditorPage() {
  const [form, setForm] = useState({ name: '', category: '', difficulty: 'beginner' });
  const mutation = useMutation({ mutationFn: () => createExercise({ name: { en: form.name, es: form.name, it: form.name }, description: { en: '' }, category: form.category, difficulty: form.difficulty, status: 'active' }) });
  return <Stack spacing={2}><Typography variant="h4">Exercise editor</Typography>{mutation.error && <Alert severity="error">{(mutation.error as Error).message}</Alert>}{mutation.isSuccess && <Alert severity="success">Saved.</Alert>}<Card><CardContent><Stack spacing={2}><TextField label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /><TextField label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /><TextField select label="Difficulty" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>{['beginner','intermediate','advanced'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField><Button onClick={() => mutation.mutate()}>Save exercise</Button></Stack></CardContent></Card></Stack>;
}
