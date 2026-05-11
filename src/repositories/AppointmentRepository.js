import { DatabasePool } from '../config/DatabasePool.js';

/**
 * Persistência de agendamentos.
 */
export class AppointmentRepository {
  /** @param {import('pg').Pool} [pool] */
  constructor(pool = DatabasePool.getPool()) {
    this.pool = pool;
  }

  /**
   * @param {string} barberId
   * @param {Date} startsAt
   * @param {Date} endsAt
   */
  async existsActiveAtSlot(barberId, startsAt, endsAt) {
    const { rows } = await this.pool.query(
      `SELECT 1 FROM appointments
       WHERE barber_id = $1
         AND status <> 'cancelled'
         AND starts_at < $3
         AND ends_at > $2
       LIMIT 1`,
      [barberId, startsAt, endsAt],
    );
    return rows.length > 0;
  }

  /**
   * @param {{ clientId: string; barberId: string; startsAt: Date; endsAt: Date }} data
   */
  async create(data) {
    const { rows } = await this.pool.query(
      `INSERT INTO appointments (client_id, barber_id, starts_at, ends_at, status)
       VALUES ($1, $2, $3, $4, 'scheduled')
       RETURNING id, client_id, barber_id, starts_at, ends_at, status, created_at`,
      [data.clientId, data.barberId, data.startsAt, data.endsAt],
    );
    return rows[0];
  }

  /**
   * @param {string} barberId
   * @param {Date} rangeStart
   * @param {Date} rangeEnd
   */
  async listBookedRanges(barberId, rangeStart, rangeEnd) {
    const { rows } = await this.pool.query(
      `SELECT starts_at, ends_at FROM appointments
       WHERE barber_id = $1
         AND status <> 'cancelled'
         AND starts_at < $3
         AND ends_at > $2
       ORDER BY starts_at`,
      [barberId, rangeStart, rangeEnd],
    );
    return rows.map((r) => ({
      startsAt: r.starts_at,
      endsAt: r.ends_at,
    }));
  }
}
