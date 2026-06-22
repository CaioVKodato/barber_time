import { DatabasePool } from '../config/DatabasePool.js';

/** Status que ocupam a grade (bloqueiam novo agendamento no mesmo intervalo). */
const BLOCKING_STATUSES = `('pending', 'confirmed')`;

/**
 * Persistência de agendamentos.
 */
export class AppointmentRepository {
  /** @param {import('pg').Pool} [pool] */
  constructor(pool = DatabasePool.getPool()) {
    this.pool = pool;
  }

  /**
   * @param {string | null} [excludeAppointmentId] ignorado na checagem (ex.: remarcação do mesmo agendamento)
   */
  async existsActiveAtSlot(barberId, startsAt, endsAt, excludeAppointmentId = null) {
    const params = [barberId, startsAt, endsAt];
    let excludeClause = '';
    if (excludeAppointmentId) {
      params.push(excludeAppointmentId);
      excludeClause = `AND id <> $${params.length}`;
    }
    const { rows } = await this.pool.query(
      `SELECT 1 FROM appointments
       WHERE barber_id = $1
         AND status IN ${BLOCKING_STATUSES}
         AND starts_at < $3
         AND ends_at > $2
         ${excludeClause}
       LIMIT 1`,
      params,
    );
    return rows.length > 0;
  }

  /**
   * @param {{ clientId: string; barberId: string; startsAt: Date; endsAt: Date }} data
   */
  async create(data) {
    const { rows } = await this.pool.query(
      `INSERT INTO appointments (client_id, barber_id, starts_at, ends_at, status)
       VALUES ($1, $2, $3, $4, 'pending')
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
         AND status IN ${BLOCKING_STATUSES}
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

  /**
   * @param {string} clientId
   */
  async listByClientId(clientId) {
    const { rows } = await this.pool.query(
      `SELECT a.id, a.client_id, a.barber_id, a.starts_at, a.ends_at, a.status, a.created_at,
              b.full_name AS barber_full_name
       FROM appointments a
       INNER JOIN barbers b ON b.id = a.barber_id
       WHERE a.client_id = $1
       ORDER BY a.starts_at DESC`,
      [clientId],
    );
    return rows;
  }

  /**
   * @param {string} appointmentId
   * @param {string} clientId
   */
  async findByIdAndClientId(appointmentId, clientId) {
    const { rows } = await this.pool.query(
      `SELECT a.id, a.client_id, a.barber_id, a.starts_at, a.ends_at, a.status, a.created_at,
              b.full_name AS barber_full_name
       FROM appointments a
       INNER JOIN barbers b ON b.id = a.barber_id
       WHERE a.id = $1 AND a.client_id = $2`,
      [appointmentId, clientId],
    );
    return rows[0] ?? null;
  }

  /**
   * @param {string} appointmentId
   * @param {string} barberId
   */
  async findByIdAndBarberId(appointmentId, barberId) {
    const { rows } = await this.pool.query(
      `SELECT a.id, a.client_id, a.barber_id, a.starts_at, a.ends_at, a.status, a.created_at,
              u.full_name AS client_full_name,
              u.email AS client_email,
              b.full_name AS barber_full_name
       FROM appointments a
       INNER JOIN users u ON u.id = a.client_id
       INNER JOIN barbers b ON b.id = a.barber_id
       WHERE a.id = $1 AND a.barber_id = $2`,
      [appointmentId, barberId],
    );
    return rows[0] ?? null;
  }

  /**
   * @param {string} barberId
   * @param {string | null} statusFilter pending | confirmed | all
   */
  async listByBarberId(barberId, statusFilter = 'pending') {
    let statusClause = `AND a.status = $2`;
    const params = [barberId];
    if (statusFilter === 'all') {
      statusClause = '';
    } else {
      params.push(statusFilter);
    }
    const { rows } = await this.pool.query(
      `SELECT a.id, a.client_id, a.barber_id, a.starts_at, a.ends_at, a.status, a.created_at,
              u.full_name AS client_full_name,
              u.email AS client_email,
              b.full_name AS barber_full_name
       FROM appointments a
       INNER JOIN users u ON u.id = a.client_id
       INNER JOIN barbers b ON b.id = a.barber_id
       WHERE a.barber_id = $1 ${statusClause}
       ORDER BY a.starts_at ASC`,
      params,
    );
    return rows;
  }

  /**
   * @param {string} appointmentId
   * @param {string} barberId
   */
  async confirmByBarber(appointmentId, barberId) {
    const { rows } = await this.pool.query(
      `UPDATE appointments
       SET status = 'confirmed'
       WHERE id = $1 AND barber_id = $2 AND status = 'pending'
       RETURNING id, client_id, barber_id, starts_at, ends_at, status, created_at`,
      [appointmentId, barberId],
    );
    return rows[0] ?? null;
  }

  /**
   * @param {string} appointmentId
   * @param {string} clientId
   * @param {Date} startsAt
   * @param {Date} endsAt
   */
  async updateSchedule(appointmentId, clientId, startsAt, endsAt) {
    const { rows } = await this.pool.query(
      `UPDATE appointments
       SET starts_at = $3, ends_at = $4
       WHERE id = $1 AND client_id = $2 AND status IN ('pending', 'confirmed')
       RETURNING id, client_id, barber_id, starts_at, ends_at, status, created_at`,
      [appointmentId, clientId, startsAt, endsAt],
    );
    return rows[0] ?? null;
  }

  /**
   * @param {string} appointmentId
   * @param {string} clientId
   */
  async cancelByClient(appointmentId, clientId) {
    const { rows } = await this.pool.query(
      `UPDATE appointments
       SET status = 'cancelled'
       WHERE id = $1 AND client_id = $2 AND status IN ('pending', 'confirmed')
       RETURNING id, client_id, barber_id, starts_at, ends_at, status, created_at`,
      [appointmentId, clientId],
    );
    return rows[0] ?? null;
  }
}
