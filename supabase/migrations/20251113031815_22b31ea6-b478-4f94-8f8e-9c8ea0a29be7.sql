-- Add points column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

-- Create function to increment user points
CREATE OR REPLACE FUNCTION public.increment_user_points(p_user_id UUID, p_points INTEGER DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET points = points + p_points
  WHERE id = p_user_id;
END;
$$;