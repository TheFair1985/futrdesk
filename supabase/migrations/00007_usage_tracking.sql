-- Migration: Add robust usage tracking and subscription statuses
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS invoices_used_this_month integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_invoices_available integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS current_period_end timestamptz;
