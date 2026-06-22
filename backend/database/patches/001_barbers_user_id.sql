-- Vincula conta de usuário (role barber) ao cadastro em barbers
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS user_id UUID NULL UNIQUE REFERENCES users (id);
