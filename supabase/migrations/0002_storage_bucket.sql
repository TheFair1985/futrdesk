-- Create the 'invoices' bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Set up basic RLS policies for storage objects in the 'invoices' bucket
CREATE POLICY "Users can view own invoice files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'invoices' AND (auth.uid())::text = (string_to_array(name, '/'))[1]);

CREATE POLICY "Users can upload own invoice files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'invoices' AND (auth.uid())::text = (string_to_array(name, '/'))[1]);
