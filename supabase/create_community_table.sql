-- Create community_messages table for persisting community chat
CREATE TABLE IF NOT EXISTS public.community_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS and allow authenticated users to select and insert their messages
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read messages (you can tighten this if needed)
CREATE POLICY "Public read" ON public.community_messages
  FOR SELECT USING (true);

-- Allow authenticated users to insert messages where auth.uid() = user_id
CREATE POLICY "Insert as auth user" ON public.community_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Optional index for faster ordering by created_at
CREATE INDEX IF NOT EXISTS community_messages_created_at_idx ON public.community_messages (created_at);
