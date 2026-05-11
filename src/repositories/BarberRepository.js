import { DatabasePool } from '../config/DatabasePool.js';

/**
 * Acesso a dados de barbeiros (prestadores).
 */
export class BarberRepository {
  /** @param {import('pg').Pool} [pool] */
  constructor(pool = DatabasePool.getPool()) {
    this.pool = pool;
  }

  /**
   * @param {string} id
   */
  async findActiveById(id) {
    const { rows } = await this.pool.query(
      `SELECT id, full_name, active FROM barbers WHERE id = $1 AND active = true`,
      [id],
    );
    return rows[0] ?? null;
  }

  async listActive() {
    const { rows } = await this.pool.query(
      `SELECT id, full_name, active, user_id FROM barbers WHERE active = true ORDER BY full_name`,
    );
    return rows;
  }

  /**
   * @param {string} userId
   */
  async findByUserId(userId) {
    const { rows } = await this.pool.query(
      `SELECT id, full_name, active, user_id FROM barbers WHERE user_id = $1`,
      [userId],
    );
    return rows[0] ?? null;
  }

  /**
   * @param {{ fullName: string; userId: string }} data
   * @param {import('pg').Pool | import('pg').PoolClient} [executor]
   */
  async create(data, executor = this.pool) {
    const { rows } = await executor.query(
      `INSERT INTO barbers (full_name, user_id)
       VALUES ($1, $2)
       RETURNING id, full_name, active, user_id, created_at`,
      [data.fullName.trim(), data.userId],
    );
    return rows[0];
  }
}
