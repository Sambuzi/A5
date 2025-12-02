-- Add image_url column to exercises so each exercise can reference a hosted image
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS image_url text;

CREATE INDEX IF NOT EXISTS idx_exercises_image_url ON public.exercises ((image_url));

-- Notes:
-- 1) Create a Supabase Storage bucket named `exercise-images` (or adjust the uploader component) and set appropriate public access or use signed URLs.
-- 2) Run this SQL in the Supabase SQL Editor or via psql/supabase CLI.
-- 3) After migration, upload images using the provided uploader component or manually set `image_url` on exercise rows.
