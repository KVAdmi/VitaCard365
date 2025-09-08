-- Migración Mercado Pago: Planes, Suscriptores, Suscripciones

CREATE TABLE IF NOT EXISTS plans (
  id BIGSERIAL PRIMARY KEY,
  external_ref VARCHAR(128) UNIQUE,
  title VARCHAR(128) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MXN',
  frequency_type VARCHAR(16) DEFAULT 'months',
  interval INT DEFAULT 1,
  trial_days INT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscribers (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(128) UNIQUE NOT NULL,
  name VARCHAR(128) NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT REFERENCES plans(id),
  subscriber_id BIGINT REFERENCES subscribers(id),
  mp_preapproval_id VARCHAR(128) UNIQUE,
  status VARCHAR(32) NOT NULL,
  next_charge_date TIMESTAMP,
  last_event_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  canceled_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscription_events (
  id BIGSERIAL PRIMARY KEY,
  subscription_id BIGINT REFERENCES subscriptions(id),
  type VARCHAR(64) NOT NULL,
  raw JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_preapproval_id ON subscriptions(mp_preapproval_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id_status ON subscriptions(plan_id, status);
CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_id_created_at ON subscription_events(subscription_id, created_at);
