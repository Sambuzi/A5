-- Create exercises table
CREATE TABLE IF NOT EXISTS public.exercises (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  level text NOT NULL,
  title text NOT NULL,
  description text,
  demo_url text,
  created_at timestamptz DEFAULT now()
);

-- Index on level for fast queries
CREATE INDEX IF NOT EXISTS idx_exercises_level ON public.exercises(level);

-- Optional seed data
INSERT INTO public.exercises (level, title, description) VALUES
('Neofita', 'Squat a corpo libero', '3 serie x 10 ripetizioni. Mantieni il busto dritto.'),
('Neofita', 'Plank', '3 serie x 30s. Mantieni il corpo in linea.'),
('Intermedio', 'Affondi con manubri', '3 serie x 12 ripetizioni per gamba.'),
('Intermedio', 'Push-up avanzati', '4 serie x 12 ripetizioni con presa stretta.'),
('Avanzato', 'Squat con bilanciere', '5 serie x 5 ripetizioni, carico progressivo.'),
('Avanzato', 'Burpees completi', '5 serie x 10 ripetizioni. Mantieni ritmo elevato.');

-- RLS: allow public SELECT, INSERT/UPDATE by authenticated user only (simple example)
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Public read exercises" ON public.exercises FOR SELECT USING (true);

-- Note: INSERT/UPDATE/DELETE policies may be restricted to admins; seeds are inserted here for convenience.
