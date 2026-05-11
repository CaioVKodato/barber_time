-- Fluxo: pending (cliente pediu) -> confirmed (barbeiro confirmou). scheduled legado -> confirmed.
-- Índice único só para pending/confirmed (completed/cancelled liberam o horário na grade).

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

UPDATE appointments SET status = 'confirmed' WHERE status = 'scheduled';

ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));

DROP INDEX IF EXISTS appointments_barber_starts_unique;

CREATE UNIQUE INDEX IF NOT EXISTS appointments_barber_starts_unique
  ON appointments (barber_id, starts_at)
  WHERE status IN ('pending', 'confirmed');
