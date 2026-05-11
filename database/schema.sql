-- BarberTime — schema PostgreSQL (Sprint 1)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'barber', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES barbers (id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT appointments_time_order CHECK (ends_at > starts_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS appointments_barber_starts_unique
  ON appointments (barber_id, starts_at)
  WHERE status <> 'cancelled';

CREATE INDEX IF NOT EXISTS appointments_client_id_idx ON appointments (client_id);
CREATE INDEX IF NOT EXISTS appointments_barber_time_idx ON appointments (barber_id, starts_at);

INSERT INTO barbers (id, full_name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'João Barbeiro'),
  ('22222222-2222-2222-2222-222222222222', 'Maria Barbeira')
ON CONFLICT (id) DO NOTHING;
