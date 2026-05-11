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
      `SELECT id, full_name, active FROM barbers WHERE active = true ORDER BY full_name`,
    );
    return rows;
  }
}
