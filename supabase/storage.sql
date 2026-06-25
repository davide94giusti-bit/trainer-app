-- Optional Supabase Storage setup for future exercise images, GIFs, and videos.
-- Run after creating the project. This assumes Supabase's storage schema exists.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'exercise-media',
  'exercise-media',
  true,
  52428800,
  array['image/png','image/jpeg','image/gif','image/webp','video/mp4','video/webm']
)
on conflict (id) do update set public = true;

create policy exercise_media_public_read on storage.objects
for select using (bucket_id = 'exercise-media');

create policy exercise_media_admin_write on storage.objects
for insert with check (bucket_id = 'exercise-media' and public.is_admin());

create policy exercise_media_admin_update on storage.objects
for update using (bucket_id = 'exercise-media' and public.is_admin()) with check (bucket_id = 'exercise-media' and public.is_admin());

create policy exercise_media_admin_delete on storage.objects
for delete using (bucket_id = 'exercise-media' and public.is_admin());
