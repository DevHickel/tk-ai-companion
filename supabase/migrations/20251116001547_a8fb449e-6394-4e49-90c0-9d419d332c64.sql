-- Add new branding fields to app_settings table
ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS browser_title TEXT DEFAULT 'TkSolution App',
ADD COLUMN IF NOT EXISTS favicon_url TEXT,
ADD COLUMN IF NOT EXISTS logo_light_url TEXT,
ADD COLUMN IF NOT EXISTS logo_dark_url TEXT,
ADD COLUMN IF NOT EXISTS login_bg_url TEXT,
ADD COLUMN IF NOT EXISTS login_bg_color TEXT,
ADD COLUMN IF NOT EXISTS login_headline TEXT DEFAULT 'Bem-vindo à Plataforma',
ADD COLUMN IF NOT EXISTS border_radius INTEGER DEFAULT 8,
ADD COLUMN IF NOT EXISTS sidebar_bg_color TEXT,
ADD COLUMN IF NOT EXISTS chat_user_bg_color TEXT,
ADD COLUMN IF NOT EXISTS chat_ai_bg_color TEXT;