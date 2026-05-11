import { DatabasePool } from '../config/DatabasePool.js';

/**
 * Acesso a dados de usuários (clientes).
 */
export class UserRepository {
  /** @param {import('pg').Pool} [pool] */
  constructor(pool = DatabasePool.getPool()) {
    this.pool = pool;
  }

  /**
   * @param {string} email
   */
  async findByEmail(email) {
    const { rows } = await this.pool.query(
      `SELECT id, email, password_hash, full_name, role, created_at
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()],
    );
    return rows[0] ?? null;
  }

  /**
   * @param {string} id
   */
  async findById(id) {
    const { rows } = await this.pool.query(
      `SELECT id, email, full_name, role, created_at FROM users WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  /**
   * @param {{ email: string; passwordHash: string; fullName: string; role?: string }} data
   */
  async create(data) {
    const role = data.role ?? 'client';
    const { rows } = await this.pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role, created_at`,
      [data.email.toLowerCase().trim(), data.passwordHash, data.fullName.trim(), role],
    );
    return rows[0];
  }
}
