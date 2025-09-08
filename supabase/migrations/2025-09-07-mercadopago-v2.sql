-- Migración Mercado Pago v2: Tablas con UUID y RLS

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_ref text UNIQUE NOT NULL,
  title text NOT NULL,
  amount numeric(12,2) NOT NULL,
  currency text DEFAULT 'MXN',
  interval int DEFAULT 1,
  frequency_type text DEFAULT 'months',
  trial_days int,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  name text,
  id_vita text UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES plans(id),
  subscriber_id uuid REFERENCES subscribers(id),
  mp_preapproval_id text UNIQUE NOT NULL,
  status text NOT NULL,
  next_charge_date timestamptz,
  last_event_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(id),
  type text NOT NULL,
  raw jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS: Solo el usuario autenticado puede leer/editar su propio subscriber y subscription
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers: user can access own" ON subscribers
  USING (user_id = auth.uid());

CREATE POLICY "Subscriptions: user can access own" ON subscriptions
  USING (subscriber_id IN (SELECT id FROM subscribers WHERE user_id = auth.uid()));

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_preapproval_id ON subscriptions(mp_preapproval_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id_status ON subscriptions(plan_id, status);
CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_id_created_at ON subscription_events(subscription_id, created_at);
