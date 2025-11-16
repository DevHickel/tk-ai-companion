-- Create fonts storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('fonts', 'fonts', true);

-- Create RLS policies for fonts bucket
CREATE POLICY "Anyone can view fonts"
ON storage.objects FOR SELECT
USING (bucket_id = 'fonts');

CREATE POLICY "Authenticated users can upload fonts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fonts' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update fonts"
ON storage.objects FOR UPDATE
USING (bucket_id = 'fonts' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete fonts"
ON storage.objects FOR DELETE
USING (bucket_id = 'fonts' AND auth.role() = 'authenticated');

-- Add new columns to app_settings
ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS custom_font_url text,
ADD COLUMN IF NOT EXISTS custom_font_name text,
ADD COLUMN IF NOT EXISTS logo_padding integer DEFAULT 0;