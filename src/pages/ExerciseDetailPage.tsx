import { Alert, Box, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import { getExerciseWithMedia } from '../services/exercises.service';
import { localized } from '../lib/format';
import { useI18n } from '../lib/i18n';

export default function ExerciseDetailPage() {
  const { id } = useParams();
  const { t, language } = useI18n();
  const query = useQuery({ queryKey: ['exercise', id], queryFn: () => getExerciseWithMedia(id!), enabled: !!id });
  if (query.isLoading) return <LoadingScreen />;
  if (query.error) return <Alert severity="error">{(query.error as Error).message}</Alert>;
  const exercise: any = query.data;
  const media = [...(exercise.exercise_media ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const primaryMedia = media[0];

  return <Stack spacing={2}>
    <Grid container spacing={2} alignItems="flex-start">
      <Grid item xs={12} md={7}>
        <Card><CardContent><Stack spacing={2}>
          <Box>
            <Typography variant="h4">{localized(exercise.name, language)}</Typography>
            <Typography color="text.secondary">{localized(exercise.description, language)}</Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {exercise.category && <Chip label={exercise.category} />}
            <Chip label={`${t('common.difficulty')}: ${t(`exercise.difficulty.${exercise.difficulty}`)}`} />
            {(exercise.muscles ?? []).map((muscle: string) => <Chip key={muscle} label={muscle} variant="outlined" />)}
          </Stack>
        </Stack></CardContent></Card>

        <Card sx={{ mt: 2 }}><CardContent><Stack spacing={2}>
          <Typography variant="h6">{t('exercise.instructions')}</Typography>
          <Typography whiteSpace="pre-line">{localized(exercise.instructions, language) || localized(exercise.description, language) || t('exercise.noInstructions')}</Typography>
          {localized(exercise.common_mistakes, language) && <><Typography variant="h6">{t('exercise.common_mistakes')}</Typography><Typography whiteSpace="pre-line">{localized(exercise.common_mistakes, language)}</Typography></>}
          {localized(exercise.safety_notes, language) && <><Typography variant="h6">{t('exercise.safety_notes')}</Typography><Typography whiteSpace="pre-line">{localized(exercise.safety_notes, language)}</Typography></>}
        </Stack></CardContent></Card>
      </Grid>

      <Grid item xs={12} md={5}>
        <Card><CardContent><Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <PlayCircleIcon color="primary" />
            <Typography variant="h6">{t('exercise.media.realisticAnimation')}</Typography>
          </Stack>
          <ExerciseMedia media={primaryMedia} language={language} />
          <Typography color="text.secondary">{t('exercise.media.customerHelp')}</Typography>
        </Stack></CardContent></Card>
      </Grid>
    </Grid>
  </Stack>;
}

function ExerciseMedia({ media, language }: { media: any; language: string }) {
  const { t } = useI18n();
  if (!media?.url) return <Alert severity="info">{t('exercise.media.notConfigured')}</Alert>;
  if (media.media_type === 'video') {
    return <Box component="video" src={media.url} controls muted playsInline loop preload="metadata" sx={{ width: '100%', borderRadius: 2, bgcolor: 'black' }} />;
  }
  return <Box component="img" src={media.url} alt={localized(media.caption, language)} sx={{ width: '100%', borderRadius: 2, objectFit: 'cover' }} />;
}
