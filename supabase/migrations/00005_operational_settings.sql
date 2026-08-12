-- Migration: Add operational workflow settings to public.users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS tax_number text,
ADD COLUMN IF NOT EXISTS vat_id text,
ADD COLUMN IF NOT EXISTS export_frequency text DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS auto_export_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS export_email text,
ADD COLUMN IF NOT EXISTS alert_channel text DEFAULT 'email';
