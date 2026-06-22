import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const email = process.argv[2] ?? 'caio.kodato@sga.pucminas.br';
const barberUserId = '33333333-3333-4333-8333-333333333333';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const r = await pool.query(
    'UPDATE users SET email = $1 WHERE id = $2 RETURNING email, full_name, role',
    [email, barberUserId],
  );
  console.log('Barbeiro atualizado:', JSON.stringify(r.rows));
} catch (err) {
  console.error('ERRO:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
