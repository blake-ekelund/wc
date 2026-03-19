-- Migration 004: Support conversations with message threads
-- Run this in Supabase SQL Editor

-- Conversations (one per user support thread)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text NOT NULL DEFAULT 'anonymous',
  user_name text NOT NULL DEFAULT 'Anonymous',
  subject text NOT NULL DEFAULT 'Support Request',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'active', 'resolved', 'closed')),
  admin_notes text DEFAULT '',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Individual messages within a conversation
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('user', 'admin', 'bot')),
  sender_name text NOT NULL DEFAULT '',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: users can see their own, service role sees all
CREATE POLICY "conversations_user_select" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "conversations_user_insert" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conversations_user_update" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role (admin API) bypasses RLS automatically
-- Allow anonymous inserts for non-authenticated users
CREATE POLICY "conversations_anon_insert" ON public.conversations
  FOR INSERT WITH CHECK (user_id IS NULL);

-- Messages: users can see messages in their conversations
CREATE POLICY "messages_user_select" ON public.conversation_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_messages.conversation_id
      AND (c.user_id = auth.uid() OR c.user_id IS NULL)
    )
  );

CREATE POLICY "messages_user_insert" ON public.conversation_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_messages.conversation_id
      AND (c.user_id = auth.uid() OR c.user_id IS NULL)
    )
  );

-- Allow anonymous message inserts
CREATE POLICY "messages_anon_insert" ON public.conversation_messages
  FOR INSERT WITH CHECK (sender = 'user' OR sender = 'bot');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_messages_conv ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_messages_created ON public.conversation_messages(created_at);
