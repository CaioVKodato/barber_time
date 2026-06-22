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
  user_id UUID NULL UNIQUE REFERENCES users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES barbers (id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT appointments_time_order CHECK (ends_at > starts_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS appointments_barber_starts_unique
  ON appointments (barber_id, starts_at)
  WHERE status IN ('pending', 'confirmed');

CREATE INDEX IF NOT EXISTS appointments_client_id_idx ON appointments (client_id);
CREATE INDEX IF NOT EXISTS appointments_barber_time_idx ON appointments (barber_id, starts_at);

-- Contas seed (login) para os dois barbeiros — senha: senha123 (apenas desenvolvimento)
INSERT INTO users (id, email, password_hash, full_name, role) VALUES
  (
    '33333333-3333-4333-8333-333333333333',
    'joao.barbeiro@barbertime.seed',
    '$2a$10$4IxJWac6eqUWeXMCPLQQp.zB0nNfOTjkJ3ErZ6h8TmFHftxvmq31O',
    'João Barbeiro',
    'barber'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'maria.barbeira@barbertime.seed',
    '$2a$10$4IxJWac6eqUWeXMCPLQQp.zB0nNfOTjkJ3ErZ6h8TmFHftxvmq31O',
    'Maria Barbeira',
    'barber'
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

INSERT INTO barbers (id, full_name, user_id) VALUES
  ('11111111-1111-1111-1111-111111111111', 'João Barbeiro', '33333333-3333-4333-8333-333333333333'),
  ('22222222-2222-2222-2222-222222222222', 'Maria Barbeira', '44444444-4444-4444-8444-444444444444')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  user_id = EXCLUDED.user_id;
