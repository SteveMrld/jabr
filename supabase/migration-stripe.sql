-- =============================================
-- JABR — Migration Stripe Subscriptions
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- Table subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  plan_id TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'annual')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(stripe_customer_id);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update (via webhook)
CREATE POLICY "Service role manages subscriptions" ON subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger updated_at
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- '2026-03'
  ai_analyses INT DEFAULT 0,
  media_plans_generated INT DEFAULT 0,
  storage_used_mb NUMERIC DEFAULT 0,
  UNIQUE(user_id, month)
);

ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own usage" ON usage
  FOR SELECT USING (auth.uid() = user_id);

-- Seed free subscription for new users
CREATE OR REPLACE FUNCTION seed_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan_id, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to existing user creation trigger
DROP TRIGGER IF EXISTS on_auth_user_sub ON auth.users;
CREATE TRIGGER on_auth_user_sub
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION seed_subscription();
