-- Seed exercises for Intermedio and Avanzato levels
-- Intermedio categories: Circuito Metabolico, Forza Base, Cardio Intermedio
-- Avanzato categories: Forza Avanzata, HIIT, Mobilità Dinamica

-- INTERMEDIO
INSERT INTO public.exercises (level, category, title, description, demo_url, created_at)
VALUES
  ('Intermedio', 'Circuito Metabolico', 'Burpees modificati', '4 round: 30s lavoro / 30s riposo, movimento controllato.', NULL, now()),
  ('Intermedio', 'Circuito Metabolico', 'Kettlebell swing leggero', '3 serie x 15, movimento da anche, non la schiena.', NULL, now()),
  ('Intermedio', 'Circuito Metabolico', 'Jumping lunges', '3 x 20 totali, mantieni equilibrio.', NULL, now()),

  ('Intermedio', 'Forza Base', 'Squat con carico leggero', '4 x 8, mantieni profondità e core attivo.', NULL, now()),
  ('Intermedio', 'Forza Base', 'Panca piana (manubri)', '4 x 6-8, controllo in discesa.', NULL, now()),
  ('Intermedio', 'Forza Base', 'Rematore con manubrio', '3 x 10 per lato, scapole attive.', NULL, now()),

  ('Intermedio', 'Cardio Intermedio', 'Corsa a ritmo sostenuto', '10-15 min a ritmo moderato.', NULL, now()),
  ('Intermedio', 'Cardio Intermedio', 'Circuito scala', '3 round su step / box: 45s lavoro / 30s riposo.', NULL, now()),
  ('Intermedio', 'Cardio Intermedio', 'Ski erg / salto corda', '2 x 3 min a sforzo controllato.', NULL, now());

-- AVANZATO
INSERT INTO public.exercises (level, category, title, description, demo_url, created_at)
VALUES
  ('Avanzato', 'Forza Avanzata', 'Squat back pesante', '5 x 5 con carichi progressivi, tecnica prima di tutto.', NULL, now()),
  ('Avanzato', 'Forza Avanzata', 'Stacco da terra', '5 x 5, mantenere schiena neutra e tirare dalle anche.', NULL, now()),
  ('Avanzato', 'Forza Avanzata', 'Military press', '4 x 6-8, controllo sul movimento.', NULL, now()),

  ('Avanzato', 'HIIT', 'Tabata completo', '8 round 20s on / 10s off con esercizi misti ad alta intensità.', NULL, now()),
  ('Avanzato', 'HIIT', 'Sprint ripetuti', '10 x 30s sprint / 90s cammino.', NULL, now()),
  ('Avanzato', 'HIIT', 'AMRAP 12', 'As many rounds as possible in 12 minutes di un circuito predefinito.', NULL, now()),

  ('Avanzato', 'Mobilità Dinamica', 'Flow mobilità spalla-anche', 'Routine dinamica completa per mobilità e recupero attivo.', NULL, now()),
  ('Avanzato', 'Mobilità Dinamica', 'Pistol squat progressions', 'Progressioni e forza unilaterale, 3 x 6 per lato.', NULL, now()),
  ('Avanzato', 'Mobilità Dinamica', 'Nordic hamstring eccentrico', '3 x 6-8, lento e controllato.', NULL, now());

-- Add index for level+category if not present
CREATE INDEX IF NOT EXISTS idx_exercises_level_category ON public.exercises (level, category);
