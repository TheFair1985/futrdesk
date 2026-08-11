-- 00002_storage_setup.sql
-- Episode 2: Supabase Storage Buckets & RLS Setup for Futrdesk

-- 1. Create Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('raw_documents', 'raw_documents', false),
  ('zugferd_invoices', 'zugferd_invoices', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS Policies
-- The storage in Supabase is managed via the storage.objects table.
-- We must restrict access so users can only interact with files in their own UUID folder.

-- Policies for raw_documents bucket
CREATE POLICY "Users can upload to their own raw_documents folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'raw_documents' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read their own raw_documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'raw_documents' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own raw_documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'raw_documents' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policies for zugferd_invoices bucket
CREATE POLICY "Users can upload to their own zugferd_invoices folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'zugferd_invoices' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read their own zugferd_invoices"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'zugferd_invoices' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own zugferd_invoices"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'zugferd_invoices' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);
