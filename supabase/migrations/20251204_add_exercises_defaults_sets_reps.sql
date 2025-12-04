-- Add default sets and reps to exercises table
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS default_sets integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS default_reps integer DEFAULT 10;

-- Optional: index for category filtering
CREATE INDEX IF NOT EXISTS idx_exercises_category_level ON public.exercises (category, level);
