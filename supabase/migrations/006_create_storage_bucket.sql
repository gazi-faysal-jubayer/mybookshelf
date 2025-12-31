-- Create a storage bucket for book covers
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-covers',
  'book-covers',
  true,
  4194304, -- 4MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload book covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'book-covers');

-- Allow public read access
CREATE POLICY "Anyone can view book covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'book-covers');

-- Allow users to update their own uploads
CREATE POLICY "Users can update their own book covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'book-covers' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own book covers
CREATE POLICY "Users can delete their own book covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'book-covers' AND (storage.foldername(name))[1] = auth.uid()::text);
