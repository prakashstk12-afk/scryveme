-- ============================================================
-- ScyrveMe — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ─── Users ────────────────────────────────────────────────────
-- Synced from Clerk via webhook on user.created / user.updated
CREATE TABLE IF NOT EXISTS public.users (
  id                   TEXT PRIMARY KEY,            -- Clerk user ID (user_xxx)
  email                TEXT UNIQUE NOT NULL,
  tier                 TEXT NOT NULL DEFAULT 'free'
                         CHECK (tier IN ('free', 'pro', 'elite')),
  credits              INTEGER NOT NULL DEFAULT 0,  -- pay-per-use credits ₹19 each (never expire)
  premium_credits      INTEGER NOT NULL DEFAULT 0,  -- premium credits ₹99 each (never expire)
  subscription_id      TEXT,                        -- Razorpay subscription ID (future)
  subscription_status  TEXT,                        -- active | cancelled | halted | expired
  subscription_end     TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Resumes ──────────────────────────────────────────────────
-- Saved scored resumes (Pro: up to 10, Elite: unlimited)
CREATE TABLE IF NOT EXISTS public.resumes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label            TEXT NOT NULL DEFAULT 'Untitled Resume', -- user-given name
  resume_text      TEXT NOT NULL,
  job_role         TEXT NOT NULL,
  job_description  TEXT,
  score_data       JSONB,        -- full ScoreResponse from AI
  improvements     JSONB,        -- cached AI section improvements (Phase 4)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Payments ─────────────────────────────────────────────────
-- All payment events (pay-per-use + subscriptions)
CREATE TABLE IF NOT EXISTS public.payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT NOT NULL REFERENCES public.users(id),
  razorpay_payment_id   TEXT UNIQUE,
  razorpay_order_id     TEXT,
  razorpay_signature    TEXT,
  amount_paise          INTEGER NOT NULL,           -- amount in paise (₹15 = 1500)
  type                  TEXT NOT NULL
                          CHECK (type IN (
                            'pay_per_use',
                            'premium',
                            'pro_monthly', 'pro_annual',
                            'elite_monthly', 'elite_annual'
                          )),
  credits_added         INTEGER NOT NULL DEFAULT 0, -- for pay_per_use / premium
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'captured', 'failed', 'refunded')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── App Config ───────────────────────────────────────────────
-- Admin-controlled settings — no code changes needed to update
CREATE TABLE IF NOT EXISTS public.app_config (
  key          TEXT PRIMARY KEY,
  value        JSONB NOT NULL,
  updated_by   TEXT,            -- admin email
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Default Config Values ────────────────────────────────────
INSERT INTO public.app_config (key, value) VALUES
  (
    'ai_model',
    '{"name": "gpt-4o-mini", "temperature": 0.2, "max_tokens": 1200}'
  ),
  (
    'rate_limits',
    '{"free_daily": 2, "pro_daily": -1, "elite_daily": -1}'
  ),
  (
    'pricing_paise',
    '{
      "pay_per_use": 1900,
      "premium": 9900
    }'
  ),
  (
    'features',
    '{
      "pay_per_use_active": true,
      "premium_active": true,
      "subscriptions_active": false
    }'
  )
ON CONFLICT (key) DO NOTHING;

-- ─── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_resumes_user_id   ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_created   ON public.resumes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_id  ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status   ON public.payments(status);

-- ─── updated_at auto-update trigger ──────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────
-- Users can only see their own data
ALTER TABLE public.users   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Service role (server-side) bypasses RLS automatically
-- These policies apply to anon / authenticated Supabase roles
CREATE POLICY "users_own_row" ON public.users
  FOR ALL USING (id = current_setting('app.clerk_user_id', TRUE));

CREATE POLICY "resumes_own_rows" ON public.resumes
  FOR ALL USING (user_id = current_setting('app.clerk_user_id', TRUE));

CREATE POLICY "payments_own_rows" ON public.payments
  FOR SELECT USING (user_id = current_setting('app.clerk_user_id', TRUE));

-- app_config is read-only for all, write via service role only
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config_read_all" ON public.app_config FOR SELECT USING (TRUE);

-- ─── Atomic credit deduction functions ───────────────────────
-- Returns the remaining balance after deduction, or -1 if no credit available.
-- Called via supabase.rpc() from server-side routes.

CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  UPDATE public.users
  SET credits = credits - 1
  WHERE id = p_user_id AND credits > 0
  RETURNING credits INTO v_remaining;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  RETURN v_remaining;
END;
$$;

CREATE OR REPLACE FUNCTION public.deduct_premium_credit(p_user_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  UPDATE public.users
  SET premium_credits = premium_credits - 1
  WHERE id = p_user_id AND premium_credits > 0
  RETURNING premium_credits INTO v_remaining;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  RETURN v_remaining;
END;
$$;

-- ─── Migration: add premium_credits to existing installs ─────
-- Run this if the table already exists without the column:
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS premium_credits INTEGER NOT NULL DEFAULT 0;
