-- Migration: add calories and weight_used to workouts
-- Run this in Supabase SQL editor (or with psql / supabase CLI).
-- NOTE: This only adds columns. Do a backup before running on production.

BEGIN;

-- Add integer calories column (kcal) and weight_used numeric(6,2)
ALTER TABLE IF EXISTS public.workouts
  ADD COLUMN IF NOT EXISTS calories integer;

ALTER TABLE IF EXISTS public.workouts
  ADD COLUMN IF NOT EXISTS weight_used numeric(6,2);

-- Optional: add index to quickly query by calories (if you plan to filter)
CREATE INDEX IF NOT EXISTS idx_workouts_calories ON public.workouts (calories);

COMMIT;

-- Optional follow-up: add fields to exercises for better estimation
-- Run as a separate migration if you want:
-- ALTER TABLE IF EXISTS public.exercises ADD COLUMN IF NOT EXISTS met numeric(4,2);
-- ALTER TABLE IF EXISTS public.exercises ADD COLUMN IF NOT EXISTS calories_per_min numeric(6,2);

-- Notes:
-- - `calories` is stored as integer (kcal). We round at save time in the frontend.
-- - `weight_used` is stored as numeric(6,2) and represents the user's weight (kg) used to compute the calories.
-- - If you need a JSON metadata column instead, adapt to `ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS metadata jsonb;` and store fields there.
-- How to apply:
-- 1) Open Supabase dashboard -> SQL Editor -> Run
--    Paste the contents of this file and execute.
-- 2) Or use supabase CLI (if configured):
--    supabase db query "$(cat 20251201_add_workouts_calories.sql)"
-- 3) Or use psql (with connection string):
--    psql "postgres://..." -f 20251201_add_workouts_calories.sql

-- After applying, the frontend will be able to save `calories` and `weight_used` for new workouts.
-- If you'd like, I can also generate a second migration to backfill calories using a default weight, but
-- backfilling is safer when you know what default weight to apply.
