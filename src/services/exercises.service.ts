import { supabase } from '../lib/supabase';
import type { Language } from '../types/domain';

export type ExerciseMediaInput = {
  media_type: 'image' | 'gif' | 'video';
  url: string;
  caption?: Record<Language, string>;
  sort_order?: number;
};

export type ExerciseSaveInput = {
  id?: string;
  name: Record<Language, string>;
  description: Record<Language, string>;
  category?: string | null;
  muscles?: string[];
  equipment?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions?: Record<Language, string>;
  common_mistakes?: Record<Language, string>;
  safety_notes?: Record<Language, string>;
  status?: 'active' | 'archived';
  media?: ExerciseMediaInput[];
};

export async function listExercises() {
  const { data, error } = await supabase.from('exercises').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getExerciseWithMedia(id: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*, exercise_media(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createExercise(input: any) {
  const { data, error } = await supabase.from('exercises').insert(input).select('*').single();
  if (error) throw error;
  return data;
}


export async function uploadExerciseMediaFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 80);
  const path = `exercises/${crypto.randomUUID()}-${safeName || `media.${extension}`}`;
  const { error } = await supabase.storage.from('exercise-media').upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('exercise-media').getPublicUrl(path);
  return data.publicUrl;
}

export async function saveExerciseWithMedia(input: ExerciseSaveInput) {
  const { media = [], id, ...exerciseInput } = input;
  const payload = {
    ...exerciseInput,
    muscles: exerciseInput.muscles ?? [],
    equipment: exerciseInput.equipment ?? [],
    status: exerciseInput.status ?? 'active',
  };

  const { data: exercise, error: exerciseError } = id
    ? await supabase.from('exercises').update(payload).eq('id', id).select('*').single()
    : await supabase.from('exercises').insert(payload).select('*').single();

  if (exerciseError) throw exerciseError;

  if (media.length > 0) {
    const { error: deleteError } = await supabase.from('exercise_media').delete().eq('exercise_id', exercise.id);
    if (deleteError) throw deleteError;

    const mediaRows = media
      .filter(item => item.url.trim())
      .map((item, index) => ({
        exercise_id: exercise.id,
        media_type: item.media_type,
        url: item.url.trim(),
        caption: item.caption ?? { en: '', es: '', it: '' },
        sort_order: item.sort_order ?? index,
      }));

    if (mediaRows.length > 0) {
      const { error: mediaError } = await supabase.from('exercise_media').insert(mediaRows);
      if (mediaError) throw mediaError;
    }
  }

  return exercise;
}

export async function archiveExercise(exerciseId: string) {
  const { error } = await supabase.rpc('archive_exercise', { exercise_id: exerciseId });
  if (error) throw error;
}
