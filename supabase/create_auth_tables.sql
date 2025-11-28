-- Create profiles table linked to Supabase Auth users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  level text,
  daily_goal text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_level on public.profiles (level);

-- Table to store login events (history)
create table if not exists public.login_history (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  ip inet,
  user_agent text,
  method text, -- e.g., 'email', 'magic_link', 'oauth'
  success boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_login_history_user on public.login_history (user_id, created_at desc);

-- Row Level Security: enable and policies
alter table public.profiles enable row level security;
alter table public.login_history enable row level security;

-- Profiles: user can select and update only their own profile
create policy profiles_select_own on public.profiles
  for select
  using (auth.uid() = id);

create policy profiles_update_own on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Allow insert into profiles only when id = auth.uid() (creating own profile)
create policy profiles_insert_own on public.profiles
  for insert
  with check (auth.uid() = id);

-- Login history: allow users to insert their own login events, and select their own events
create policy login_history_insert_own on public.login_history
  for insert
  with check (auth.uid() = user_id);

create policy login_history_select_own on public.login_history
  for select
  using (auth.uid() = user_id);

-- Optionally allow admins (service role) to read everything; this is default for service_role

-- Trigger to update profiles.updated_at on change
create or replace function public.update_profiles_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql volatility stable;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure public.update_profiles_timestamp();

-- Quick example inserts (replace <user-uuid> with a real user id from Auth)
-- insert into public.profiles (id, full_name, level) values ('<user-uuid>', 'Mario Rossi', 'Neofita');
-- insert into public.login_history (user_id, ip, user_agent, method) values ('<user-uuid>', '127.0.0.1', 'dev-agent', 'email');
