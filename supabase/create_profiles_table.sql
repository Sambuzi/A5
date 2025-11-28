-- Create `profiles` table used by the app (run in Supabase SQL Editor)
-- This creates the table and Row-Level Security policies so each authenticated
-- user can select/insert/update only their own profile row.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  level text,
  goal text,
  notifications boolean default true,
  updated_at timestamptz default now()
);

-- Enable RLS and add basic policies for select/insert/update by owner
alter table public.profiles enable row level security;

create policy "Profiles - select own" on public.profiles
  for select
  using (auth.uid() = id);

create policy "Profiles - insert own" on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Profiles - update own" on public.profiles
  for update
  using (auth.uid() = id);

-- Optional: if you add additional columns later, consider adding a
-- trigger to update `updated_at` automatically.
