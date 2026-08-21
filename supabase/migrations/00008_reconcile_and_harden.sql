-- ============================================================================
-- 00008_reconcile_and_harden.sql
-- Consolidates the two conflicting migration series (00001-00007 / 0001-0002)
-- and the drifted live DB into ONE canonical schema.
--
-- Idempotent: safe to run multiple times and against any prior state
-- (fresh project, Series A state, Series B state, or the drifted live DB).
--
-- Canonical decisions:
--   * users.tier            : TEXT ('STARTER' | 'PRO' | 'BUSINESS')
--   * channels.phone_number : canonical WhatsApp column (NOT whatsapp_number)
--   * invoices.status       : processing | needs_fix | completed | failed |
--                             payment_required | archived
--   * storage buckets       : raw_documents, zugferd_invoices, invoices (private)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. USERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  company_name text,
  tax_number text,
  vat_id text,
  tier text DEFAULT 'STARTER',
  billing_interval text DEFAULT 'monthly',
  alert_channel text,
  export_email text,
  export_frequency text DEFAULT 'monthly',
  auto_export_enabled boolean DEFAULT true,
  auto_send_invoices boolean DEFAULT false,
  export_target text,
  futrdesk_invoice_email text,
  cost_center text,
  department text,
  phone_number text,
  storage_used_bytes bigint DEFAULT 0,
  invoices_used_this_month integer DEFAULT 0,
  extra_invoices_available integer DEFAULT 0,
  subscription_status text DEFAULT 'none',
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Migrate legacy integer tier -> text tier (Series A / drifted live DB)
DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'tier';

  IF col_type IN ('integer', 'smallint', 'bigint', 'numeric') THEN
    ALTER TABLE public.users
      ALTER COLUMN tier DROP DEFAULT,
      ALTER COLUMN tier TYPE text USING (
        CASE
          WHEN tier::int >= 3 THEN 'BUSINESS'
          WHEN tier::int = 2 THEN 'PRO'
          ELSE 'STARTER'
        END
      ),
      ALTER COLUMN tier SET DEFAULT 'STARTER',
      ADD CONSTRAINT users_tier_check CHECK (tier IN ('STARTER', 'PRO', 'BUSINESS'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL; -- constraint already exists
END $$;

-- Ensure every column exists even if the table pre-dates this migration
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tax_number text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vat_id text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS billing_interval text DEFAULT 'monthly';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS alert_channel text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS export_email text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS export_frequency text DEFAULT 'monthly';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auto_export_enabled boolean DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auto_send_invoices boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS export_target text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS futrdesk_invoice_email text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cost_center text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS storage_used_bytes bigint DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS invoices_used_this_month integer DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS extra_invoices_available integer DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'none';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_period_end timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ----------------------------------------------------------------------------
-- 2. CHANNELS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('whatsapp', 'telegram', 'email')),
  connection_status text NOT NULL DEFAULT 'pending' CHECK (connection_status IN ('pending', 'active')),
  magic_code text NOT NULL,
  phone_number text,
  telegram_chat_id text,
  email_address text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, platform)
);

ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS telegram_chat_id text;
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS email_address text;

CREATE INDEX IF NOT EXISTS idx_channels_magic_code ON public.channels(magic_code);
CREATE INDEX IF NOT EXISTS idx_channels_user ON public.channels(user_id);

-- ----------------------------------------------------------------------------
-- 3. INVOICES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invoice_number text,
  vendor_name text,
  net_amount numeric,
  gross_amount numeric,
  tax_rate numeric,
  pdf_url text,
  pdf_storage_path text,
  xml_storage_path text,
  status text NOT NULL DEFAULT 'processing',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS vendor_name text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS net_amount numeric;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS gross_amount numeric;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tax_rate numeric;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS pdf_storage_path text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS xml_storage_path text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Replace any legacy status CHECK with the canonical value set
DO $$
DECLARE
  con record;
BEGIN
  FOR con IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.invoices'::regclass
      AND c.contype = 'c'
      AND a.attname = 'status'
  LOOP
    EXECUTE format('ALTER TABLE public.invoices DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('processing', 'needs_fix', 'completed', 'failed', 'payment_required', 'archived'));

CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON public.invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON public.invoices(created_at);

-- ----------------------------------------------------------------------------
-- 4. CLIENTS (referenced by generated types, kept for compatibility)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  client_name text,
  full_address text,
  created_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "channels_own_all" ON public.channels;
CREATE POLICY "channels_own_all" ON public.channels
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "invoices_select_own" ON public.invoices;
CREATE POLICY "invoices_select_own" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "invoices_update_own" ON public.invoices;
CREATE POLICY "invoices_update_own" ON public.invoices
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "clients_own_all" ON public.clients;
CREATE POLICY "clients_own_all" ON public.clients
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6. STORAGE BUCKETS + POLICIES
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('raw_documents', 'raw_documents', false),
       ('zugferd_invoices', 'zugferd_invoices', false),
       ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "authenticated_read_own_files" ON storage.objects;
CREATE POLICY "authenticated_read_own_files" ON storage.objects
  FOR SELECT TO authenticated
  USING ((storage.foldername(name))[1] = auth.uid()::text
         AND bucket_id IN ('raw_documents', 'zugferd_invoices', 'invoices'));

DROP POLICY IF EXISTS "authenticated_write_own_files" ON storage.objects;
CREATE POLICY "authenticated_write_own_files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK ((storage.foldername(name))[1] = auth.uid()::text
              AND bucket_id IN ('raw_documents', 'zugferd_invoices', 'invoices'));

DROP POLICY IF EXISTS "authenticated_delete_own_files" ON storage.objects;
CREATE POLICY "authenticated_delete_own_files" ON storage.objects
  FOR DELETE TO authenticated
  USING ((storage.foldername(name))[1] = auth.uid()::text
         AND bucket_id IN ('raw_documents', 'zugferd_invoices', 'invoices'));

-- ----------------------------------------------------------------------------
-- 7. ATOMIC QUOTA CONSUMPTION (used by lib/billing/usage.ts)
-- Locks the user row, resets the monthly window when the period rolled over,
-- consumes monthly quota first, then extra packs. Returns true if allowed.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_invoice_quota(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier text;
  v_used integer;
  v_extra integer;
  v_period_end timestamptz;
  v_limit integer;
BEGIN
  SELECT tier, invoices_used_this_month, extra_invoices_available, current_period_end
  INTO v_tier, v_used, v_extra, v_period_end
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Monatsfenster zurücksetzen, wenn die Periode abgelaufen ist
  IF v_period_end IS NOT NULL AND v_period_end < now() THEN
    v_used := 0;
  END IF;

  v_limit := CASE v_tier
    WHEN 'PRO' THEN 75
    WHEN 'BUSINESS' THEN 150
    ELSE 25
  END;

  IF COALESCE(v_used, 0) < v_limit THEN
    UPDATE public.users
    SET invoices_used_this_month = COALESCE(v_used, 0) + 1,
        current_period_end = CASE
          WHEN current_period_end IS NULL OR current_period_end < now()
          THEN now() + interval '1 month'
          ELSE current_period_end
        END,
        updated_at = now()
    WHERE id = p_user_id;
    RETURN TRUE;
  END IF;

  IF COALESCE(v_extra, 0) > 0 THEN
    UPDATE public.users
    SET extra_invoices_available = v_extra - 1,
        updated_at = now()
    WHERE id = p_user_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_invoice_quota(uuid) TO service_role, authenticated;

-- ----------------------------------------------------------------------------
-- 8. NEW USER TRIGGER (fixed: no updated_at insert, text tier)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, tier, created_at, updated_at)
  VALUES (NEW.id, NEW.email, 'STARTER', now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
