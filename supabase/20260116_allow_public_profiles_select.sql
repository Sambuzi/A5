-- Migration: allow public select on profiles so avatars are visible in community

-- WARNING: this makes the entire profiles table selectable by unauthenticated/public clients.
-- If you only want to expose avatar_url and id, consider creating a view or a server RPC instead.

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to SELECT from profiles (public read)
-- Note: PostgreSQL does not support IF NOT EXISTS for CREATE POLICY, so run this only if the policy
-- does not already exist in your database.

CREATE POLICY "Public select profiles - allow avatars" ON public.profiles
  FOR SELECT
  USING (true);

-- After running this migration, clients will be able to SELECT avatar_url and other profile columns.
-- Apply this in Supabase SQL Editor or via your migration tooling.
