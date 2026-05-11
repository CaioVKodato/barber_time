import pg from 'pg';
import { env } from './env.js';

/**
 * Responsável por criar e expor o pool de conexões PostgreSQL.
 */
export class DatabasePool {
  /** @type {pg.Pool | null} */
  static #pool = null;

  static getPool() {
    if (!this.#pool) {
      this.#pool = new pg.Pool({
        connectionString: env.databaseUrl,
        max: 10,
      });
    }
    return this.#pool;
  }

  static async end() {
    if (this.#pool) {
      await this.#pool.end();
      this.#pool = null;
    }
  }
}
