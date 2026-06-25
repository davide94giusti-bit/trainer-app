import {
  Alert,
  Button,
  Card,
  Box,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import LoadingScreen from '../../components/LoadingScreen';
import { getExerciseWithMedia, saveExerciseWithMedia, uploadExerciseMediaFile } from '../../services/exercises.service';
import { queryClient } from '../../lib/queryClient';
import { localized } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import type { Language } from '../../types/domain';

const emptyLocalized = { en: '', es: '', it: '' };

function splitList(value: string) {
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

function joinList(value: string[] | null | undefined) {
  return (value ?? []).join(', ');
}

function localizedFrom(value: any, fallback = '') {
  return {
    en: value?.en ?? fallback,
    es: value?.es ?? fallback,
    it: value?.it ?? fallback,
  } as Record<Language, string>;
}

export default function ExerciseEditorPage() {
  const { t, language } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const query = useQuery({ queryKey: ['exercise', id], queryFn: () => getExerciseWithMedia(id!), enabled: isEdit });

  const [form, setForm] = useState({
    name: localizedFrom(null),
    description: localizedFrom(null),
    instructions: localizedFrom(null),
    common_mistakes: localizedFrom(null),
    safety_notes: localizedFrom(null),
    category: '',
    muscles: '',
    equipment: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    status: 'active' as 'active' | 'archived',
    media_type: 'video' as 'image' | 'gif' | 'video',
    animation_url: '',
    animation_caption: localizedFrom(null),
  });

  useEffect(() => {
    if (!query.data) return;
    const exercise: any = query.data;
    const primaryMedia = [...(exercise.exercise_media ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
    setForm({
      name: localizedFrom(exercise.name),
      description: localizedFrom(exercise.description),
      instructions: localizedFrom(exercise.instructions),
      common_mistakes: localizedFrom(exercise.common_mistakes),
      safety_notes: localizedFrom(exercise.safety_notes),
      category: exercise.category ?? '',
      muscles: joinList(exercise.muscles),
      equipment: joinList(exercise.equipment),
      difficulty: exercise.difficulty ?? 'beginner',
      status: exercise.status ?? 'active',
      media_type: primaryMedia?.media_type ?? 'video',
      animation_url: primaryMedia?.url ?? '',
      animation_caption: localizedFrom(primaryMedia?.caption),
    });
  }, [query.data]);

  const uploadMutation = useMutation({
    mutationFn: uploadExerciseMediaFile,
    onSuccess: publicUrl => setForm(current => ({ ...current, animation_url: publicUrl })),
  });

  const mutation = useMutation({
    mutationFn: () => saveExerciseWithMedia({
      id,
      name: form.name,
      description: form.description,
      instructions: form.instructions,
      common_mistakes: form.common_mistakes,
      safety_notes: form.safety_notes,
      category: form.category || null,
      muscles: splitList(form.muscles),
      equipment: splitList(form.equipment),
      difficulty: form.difficulty,
      status: form.status,
      media: form.animation_url ? [{ media_type: form.media_type, url: form.animation_url, caption: form.animation_caption, sort_order: 0 }] : [],
    }),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      queryClient.invalidateQueries({ queryKey: ['exercise', id] });
      if (!isEdit) navigate(`/admin/exercises/${data.id}`);
    },
  });

  const previewMedia = useMemo(() => form.animation_url ? { url: form.animation_url, media_type: form.media_type, caption: form.animation_caption } : null, [form.animation_url, form.media_type, form.animation_caption]);

  if (query.isLoading) return <LoadingScreen />;

  return <Stack spacing={2}>
    <Typography variant="h4">{isEdit ? t('admin.editExercise') : t('admin.exerciseEditor')}</Typography>
    <Typography color="text.secondary">{t('exercise.media.realisticHelp')}</Typography>
    {query.error && <Alert severity="error">{(query.error as Error).message}</Alert>}
    {mutation.error && <Alert severity="error">{(mutation.error as Error).message}</Alert>}
    {uploadMutation.error && <Alert severity="error">{(uploadMutation.error as Error).message}</Alert>}
    {mutation.isSuccess && <Alert severity="success">{t('common.success')}</Alert>}
    <Grid container spacing={2}>
      <Grid item xs={12} md={7}>
        <Card><CardContent><Stack spacing={2}>
          <Typography variant="h6">{t('exercise.editor.basicInfo')}</Typography>
          <Grid container spacing={2}>
            {(['en', 'es', 'it'] as Language[]).map(lang => <Grid item xs={12} md={4} key={lang}>
              <TextField fullWidth label={`${t('common.name')} (${lang.toUpperCase()})`} value={form.name[lang]} onChange={e => setForm({ ...form, name: { ...form.name, [lang]: e.target.value } })} />
            </Grid>)}
          </Grid>
          <Grid container spacing={2}>
            {(['en', 'es', 'it'] as Language[]).map(lang => <Grid item xs={12} key={lang}>
              <TextField fullWidth multiline minRows={2} label={`${t('common.description')} (${lang.toUpperCase()})`} value={form.description[lang]} onChange={e => setForm({ ...form, description: { ...form.description, [lang]: e.target.value } })} />
            </Grid>)}
          </Grid>
          <TextField label={t('common.category')} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          <TextField label={t('exercise.musclesCsv')} value={form.muscles} onChange={e => setForm({ ...form, muscles: e.target.value })} helperText={t('exercise.csvHelp')} />
          <TextField label={t('exercise.equipmentCsv')} value={form.equipment} onChange={e => setForm({ ...form, equipment: e.target.value })} helperText={t('exercise.csvHelp')} />
          <TextField select label={t('common.difficulty')} value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value as typeof form.difficulty })}>{['beginner','intermediate','advanced'].map(v => <MenuItem key={v} value={v}>{t(`exercise.difficulty.${v}`)}</MenuItem>)}</TextField>
          <TextField select label={t('common.status')} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as typeof form.status })}>{['active','archived'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField>
        </Stack></CardContent></Card>
      </Grid>
      <Grid item xs={12} md={5}>
        <Card><CardContent><Stack spacing={2}>
          <Typography variant="h6">{t('exercise.media.title')}</Typography>
          <TextField select label={t('exercise.media.type')} value={form.media_type} onChange={e => setForm({ ...form, media_type: e.target.value as typeof form.media_type })}>
            <MenuItem value="video">{t('exercise.media.video')}</MenuItem>
            <MenuItem value="gif">{t('exercise.media.gif')}</MenuItem>
            <MenuItem value="image">{t('exercise.media.image')}</MenuItem>
          </TextField>
          <Button variant="outlined" component="label" disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? t('exercise.media.uploading') : t('exercise.media.uploadFile')}
            <input hidden type="file" accept="image/gif,image/png,image/jpeg,image/webp,video/mp4,video/webm" onChange={event => { const file = event.target.files?.[0]; if (file) uploadMutation.mutate(file); }} />
          </Button>
          <TextField label={t('exercise.media.animationUrl')} value={form.animation_url} onChange={e => setForm({ ...form, animation_url: e.target.value })} helperText={t('exercise.media.urlHelp')} />
          {(['en', 'es', 'it'] as Language[]).map(lang => <TextField key={lang} label={`${t('common.caption')} (${lang.toUpperCase()})`} value={form.animation_caption[lang]} onChange={e => setForm({ ...form, animation_caption: { ...form.animation_caption, [lang]: e.target.value } })} />)}
          <AnimationPreview media={previewMedia} language={language} />
        </Stack></CardContent></Card>
      </Grid>
      <Grid item xs={12}>
        <Card><CardContent><Stack spacing={2}>
          <Typography variant="h6">{t('exercise.editor.coachingDetails')}</Typography>
          {(['instructions', 'common_mistakes', 'safety_notes'] as const).map(field => <Stack spacing={1} key={field}>
            <Typography variant="subtitle2">{t(`exercise.${field}`)}</Typography>
            {(['en', 'es', 'it'] as Language[]).map(lang => <TextField key={lang} fullWidth multiline minRows={2} label={`${lang.toUpperCase()}`} value={form[field][lang]} onChange={e => setForm({ ...form, [field]: { ...form[field], [lang]: e.target.value } })} />)}
          </Stack>)}
          <Button variant="contained" onClick={() => mutation.mutate()} disabled={mutation.isPending || uploadMutation.isPending}>{t('admin.saveExercise')}</Button>
        </Stack></CardContent></Card>
      </Grid>
    </Grid>
  </Stack>;
}

function AnimationPreview({ media, language }: { media: { url: string; media_type: 'image' | 'gif' | 'video'; caption?: Record<Language, string> } | null; language: string }) {
  const { t } = useI18n();
  if (!media?.url) return <Alert severity="info">{t('exercise.media.emptyPreview')}</Alert>;
  return <Card variant="outlined"><CardContent><Stack spacing={1}>
    <Typography variant="subtitle2">{t('exercise.media.preview')}</Typography>
    {media.media_type === 'video' ? <Box component="video" src={media.url} controls muted playsInline loop sx={{ width: '100%', borderRadius: 2, bgcolor: 'black' }} /> : <Box component="img" src={media.url} alt={localized(media.caption, language)} sx={{ width: '100%', borderRadius: 2, objectFit: 'cover' }} />}
    {localized(media.caption, language) && <Typography variant="caption" color="text.secondary">{localized(media.caption, language)}</Typography>}
  </Stack></CardContent></Card>;
}
