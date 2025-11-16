-- Add button_hover_color column to app_settings
ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS button_hover_color text;