import { Alert, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export default function WorkoutPlanEditorPage() {
  const [form, setForm] = useState({ title: '', status: 'draft' });
  const mutation = useMutation({ mutationFn: async () => { const { data, error } = await supabase.from('workout_plans').insert({ title: { en: form.title, es: form.title, it: form.title }, status: form.status }).select('*').single(); if (error) throw error; return data; } });
  return <Stack spacing={2}><Typography variant="h4">Workout plan editor</Typography>{mutation.error && <Alert severity="error">{(mutation.error as Error).message}</Alert>}{mutation.isSuccess && <Alert severity="success">Saved.</Alert>}<Card><CardContent><Stack spacing={2}><TextField label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /><TextField select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{['draft','active','archived'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField><Button onClick={() => mutation.mutate()}>Save plan</Button></Stack></CardContent></Card></Stack>;
}
