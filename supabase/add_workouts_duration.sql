-- Add duration column to workouts if missing
ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS duration integer DEFAULT 0;

-- ensure index exists
CREATE INDEX IF NOT EXISTS idx_workouts_user_performed ON public.workouts (user_id, performed_at desc);

-- Sample upsert to record a workout with duration (seconds):
-- INSERT INTO public.workouts (user_id, exercise, duration, reps, performed_at) VALUES ('<uuid>', 'Push-ups', 900, 30, now());
