-- RYNVA — allow 'scene' as a generations.type (multi-character scene
-- composition, see /ai/scene). Run after 0001 and 0002.

alter table public.generations drop constraint if exists generations_type_check;
alter table public.generations add constraint generations_type_check
  check (
    type in ('image', 'video', 'design', 'audio', 'photo-bg-remove', 'photo-enhance', 'scene')
  );
