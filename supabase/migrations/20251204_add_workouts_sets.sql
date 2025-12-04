-- Add set tracking columns to workouts table
ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS set_number integer,
  ADD COLUMN IF NOT EXISTS sets_total integer,
  ADD COLUMN IF NOT EXISTS weight_used numeric(6,2);

-- Optional: create an index to query workouts by user and performed_at
CREATE INDEX IF NOT EXISTS idx_workouts_user_performed_at ON public.workouts (user_id, performed_at);
