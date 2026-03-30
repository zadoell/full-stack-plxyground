-- PLXYGROUND Supabase Storage Setup
-- Run this in the Supabase SQL Editor AFTER the main migration
-- This creates a public storage bucket for media uploads

-- 1. Create the 'media' bucket (public so images/videos render without auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  TRUE,
  52428800,  -- 50 MB
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public read access (so media URLs work without tokens)
CREATE POLICY "Public read access on media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- 3. Allow authenticated uploads via service role (backend handles auth)
--    The service_role key already bypasses RLS, so this is for completeness
CREATE POLICY "Service role upload on media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media');

-- 4. Allow service role deletes
CREATE POLICY "Service role delete on media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media');
