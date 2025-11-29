-- Add category column to exercises and seed categories + exercises for 'Neofita' level

ALTER TABLE IF EXISTS public.exercises
ADD COLUMN IF NOT EXISTS category text;

-- Example categories (workout types) for 'Neofita' level
-- 1) Full Body Beginner
-- 2) Cardio Starter
-- 3) Core Basics

-- Insert sample exercises for Full Body Beginner
INSERT INTO public.exercises (level, category, title, description, demo_url, created_at)
VALUES
  ('Neofita', 'Full Body Beginner', 'Squat a corpo libero', '3 serie x 10 ripetizioni. Mantieni schiena dritta.', NULL, now()),
  ('Neofita', 'Full Body Beginner', 'Piegamenti sulle ginocchia', '3 serie x 8-12 ripetizioni. Appoggia le ginocchia per ridurre difficoltà.', NULL, now()),
  ('Neofita', 'Full Body Beginner', 'Affondi in camminata', '2 serie x 8 per gamba. Controlla il busto.', NULL, now());

-- Insert sample exercises for Cardio Starter
INSERT INTO public.exercises (level, category, title, description, demo_url, created_at)
VALUES
  ('Neofita', 'Cardio Starter', 'Marcia sul posto', '30s attivo / 30s riposo, 5 round.', NULL, now()),
  ('Neofita', 'Cardio Starter', 'Saltelli leggeri', '30-45s, mantieni ritmo moderato.', NULL, now()),
  ('Neofita', 'Cardio Starter', 'Step-up su gradino basso', '2 serie x 20 passi totali.', NULL, now());

-- Insert sample exercises for Core Basics
INSERT INTO public.exercises (level, category, title, description, demo_url, created_at)
VALUES
  ('Neofita', 'Core Basics', 'Plank sulle ginocchia', '3 x 20-30s, mantieni core contratto.', NULL, now()),
  ('Neofita', 'Core Basics', 'Crunch modificato', '3 serie x 12 ripetizioni, mantieni collo rilassato.', NULL, now()),
  ('Neofita', 'Core Basics', 'Dead Bug', '3 serie x 10 per lato, controlla la respirazione.', NULL, now());

-- Optionally add indexes for category queries
CREATE INDEX IF NOT EXISTS idx_exercises_level_category ON public.exercises (level, category);
