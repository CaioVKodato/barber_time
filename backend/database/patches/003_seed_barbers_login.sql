-- Barbeiros do seed com conta de login (senha: senha123 — apenas desenvolvimento)
-- Hash bcrypt cost 10 gerado para a string "senha123"

INSERT INTO users (id, email, password_hash, full_name, role) VALUES
  (
    '33333333-3333-4333-8333-333333333333',
    'caio.kodato@sga.pucminas.br',
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

UPDATE barbers SET user_id = '33333333-3333-4333-8333-333333333333'
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE barbers SET user_id = '44444444-4444-4444-8444-444444444444'
WHERE id = '22222222-2222-2222-2222-222222222222';
