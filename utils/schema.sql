-- Future Desk OS - Supabase Database Schema

-- Table 1: Processed Signals (Prevents duplicate posts across pipeline runs)
CREATE TABLE IF NOT EXISTS public.processed_signals (
    id TEXT PRIMARY KEY,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp_processed TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Subscribers (Newsletter Leads & Plunk Sync)
CREATE TABLE IF NOT EXISTS public.subscribers (
    email TEXT PRIMARY KEY,
    source TEXT DEFAULT 'futrdesk_newsletter',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security) if needed or allow service role access
ALTER TABLE public.processed_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public / anon read/write policy if using anon key
CREATE POLICY "Allow anon select on processed_signals" ON public.processed_signals FOR SELECT USING (true);
CREATE POLICY "Allow anon insert/upsert on processed_signals" ON public.processed_signals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select on subscribers" ON public.subscribers FOR SELECT USING (true);
CREATE POLICY "Allow anon insert/upsert on subscribers" ON public.subscribers FOR INSERT WITH CHECK (true);
