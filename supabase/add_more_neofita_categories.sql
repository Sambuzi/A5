-- Seed additional Neofita categories and exercises
-- Adds Mobilità, Stretch & Recovery, Upper Body Intro, Lower Body Intro exercises for level 'Neofita'

INSERT INTO public.exercises (level, category, title, description, demo_url, created_at)
VALUES
  ('Neofita', 'Mobilità', 'Rotazioni delle spalle', '2 serie x 12 movimenti, mantieni il controllo.', NULL, now()),
  ('Neofita', 'Mobilità', 'Cerchio anche', '2 serie x 10 per lato, muovi ginocchia e anche lentamente.', NULL, now()),
  ('Neofita', 'Mobilità', 'Aperture torace contro muro', '3 serie x 10 respiri profondi.', NULL, now()),

  ('Neofita', 'Stretch & Recovery', 'Stretch cat-cow', '2 serie x 8 ripetizioni per mobilizzare la colonna.', NULL, now()),
  ('Neofita', 'Stretch & Recovery', 'Stretch inguinale leggero', '2 serie x 30s per lato.', NULL, now()),
  ('Neofita', 'Stretch & Recovery', 'Stretch posteriori coscia seduto', '3 x 30s per gamba, respirazione controllata.', NULL, now()),

  ('Neofita', 'Upper Body Intro', 'Rematore con elastico', '3 serie x 12, mantenere scapole attive.', NULL, now()),
  ('Neofita', 'Upper Body Intro', 'Plank su gomiti (modificato)', '3 x 20s, mantieni bacino neutro.', NULL, now()),
  ('Neofita', 'Upper Body Intro', 'Alzate laterali leggere (bottiglie)', '3 x 12, movimento controllato.', NULL, now()),

  ('Neofita', 'Lower Body Intro', 'Ponte glutei', '3 serie x 12, contrai in cima.', NULL, now()),
  ('Neofita', 'Lower Body Intro', 'Calf raises', '3 x 15, salita controllata.', NULL, now()),
  ('Neofita', 'Lower Body Intro', 'Step laterale', '2 x 20 passi totali, ritmo tranquillo.', NULL, now());

-- Add index for quick category lookups
CREATE INDEX IF NOT EXISTS idx_exercises_level_category ON public.exercises (level, category);
