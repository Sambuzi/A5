-- SQL: create workouts table for WellGym
create table if not exists public.workouts (
  id bigserial primary key,
  user_id uuid,
  exercise text not null,
  duration integer, -- seconds
  reps integer,
  performed_at timestamptz default now()
);

-- Optional: add index on user and performed_at
create index if not exists idx_workouts_user_performed on public.workouts (user_id, performed_at desc);
