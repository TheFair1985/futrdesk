-- 00001_init_schema.sql
-- Episode 1: Supabase Database Schema & RLS Setup for Futrdesk

-- Ensure uuid-ossp extension is enabled for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------
-- Table 1: users (Das B2B-Konto)
--------------------------------------------------------
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name text NOT NULL,
    vat_id text NOT NULL,
    phone_number text UNIQUE NOT NULL,
    email text NOT NULL,
    tier integer DEFAULT 1,
    billing_cycle_usage integer DEFAULT 0,
    storage_used_mb numeric DEFAULT 0.0,
    created_at timestamptz DEFAULT now()
);

--------------------------------------------------------
-- Table 2: clients (Das unsichtbare CRM)
--------------------------------------------------------
CREATE TABLE public.clients (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_name text NOT NULL,
    full_address text NOT NULL,
    created_at timestamptz DEFAULT now()
);

--------------------------------------------------------
-- Table 3: invoices (Das GoBD Archiv)
--------------------------------------------------------
CREATE TABLE public.invoices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    invoice_number text NOT NULL,
    pdf_url text,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'sent')),
    created_at timestamptz DEFAULT now()
);

--------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY (RLS)
--------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------
-- RLS POLICIES
--------------------------------------------------------

-- Policies for 'users' table
CREATE POLICY "Users can manage their own profile"
    ON public.users
    FOR ALL
    USING (auth.uid() = id);

-- Policies for 'clients' table
CREATE POLICY "Users can manage their own clients"
    ON public.clients
    FOR ALL
    USING (auth.uid() = user_id);

-- Policies for 'invoices' table
CREATE POLICY "Users can manage their own invoices"
    ON public.invoices
    FOR ALL
    USING (auth.uid() = user_id);
