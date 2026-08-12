-- Migration: Add multi-channel support to channels table
ALTER TABLE public.channels
ADD COLUMN IF NOT EXISTS telegram_chat_id text UNIQUE,
ADD COLUMN IF NOT EXISTS email_address text UNIQUE;
