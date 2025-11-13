-- Add pinned column to conversations table
ALTER TABLE public.conversations
ADD COLUMN pinned boolean NOT NULL DEFAULT false;

-- Add index for better performance when querying pinned conversations
CREATE INDEX idx_conversations_pinned ON public.conversations(user_id, pinned DESC, updated_at DESC);