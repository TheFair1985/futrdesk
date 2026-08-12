-- Migration: Add billing and storage metrics to public.users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS storage_used_bytes bigint DEFAULT 0;
