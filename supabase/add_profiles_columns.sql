-- Add additional profile columns useful for the app
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS preferred_duration integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS preferred_categories text DEFAULT '';

-- Optional: grant default select/upsert permissions depending on your RLS setup
-- Please review and adapt RLS policies as needed for your project.
