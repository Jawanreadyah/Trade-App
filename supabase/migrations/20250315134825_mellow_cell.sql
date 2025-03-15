/*
  # Create Storage Bucket for Item Images

  1. New Storage
    - Create a public bucket for item images
    - Enable public access for item images
*/

-- Create a new public bucket for item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('items', 'items', true);

-- Set up security policies for the items bucket
CREATE POLICY "Anyone can view item images"
ON storage.objects FOR SELECT
USING (bucket_id = 'items');

CREATE POLICY "Authenticated users can upload item images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'items' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);