-- Add account_status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'Pendente';

-- Update existing users with null status to 'Cadastrado'
UPDATE public.profiles 
SET account_status = 'Cadastrado' 
WHERE account_status IS NULL AND full_name IS NOT NULL;