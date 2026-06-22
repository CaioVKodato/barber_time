import { DateTime } from 'luxon';
import { env } from '../config/env.js';
import { isValidBookableSlotStart } from '../domain/schedulePolicy.js';
import { AppError } from '../errors/AppError.js';
import { EventPublisher } from '../messaging/EventPublisher.js';
import { AppointmentRepository } from '../repositories/AppointmentRepository.js';
import { BarberRepository } from '../repositories/BarberRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';

/**
 * Agendamentos: criar, listar do cliente, remarcar e cancelar.
 */
export class AppointmentService {
  /**
   * @param {AppointmentRepository} appointmentRepository
   * @param {BarberRepository} barberRepository
   * @param {UserRepository} userRepository
   * @param {EventPublisher} eventPublisher
   */
  constructor(
    appointmentRepository = new AppointmentRepository(),
    barberRepository = new BarberRepository(),
    userRepository = new UserRepository(),
    eventPublisher = new EventPublisher(),
  ) {
    this.appointmentRepository = appointmentRepository;
    this.barberRepository = barberRepository;
    this.userRepository = userRepository;
    this.eventPublisher = eventPublisher;
  }

  /**
   * @param {{ clientId: string; barberId: string; startsAtIso: string }} input
   */
  async scheduleHaircut(input) {
    if (!input.barberId) {
      throw new AppError('barberId é obrigatório.', 422);
    }

    const { starts, startsUtc, endsUtc } = this.#parseSlot(input.startsAtIso);

    const barber = await this.barberRepository.findActiveById(input.barberId);
    if (!barber) {
      throw new AppError('Barbeiro não encontrado ou inativo.', 404);
    }

    this.#assertNotInPast(startsUtc);
    this.#assertWithinBusinessDay(starts);

    const conflict = await this.appointmentRepository.existsActiveAtSlot(
      input.barberId,
      startsUtc.toJSDate(),
      endsUtc.toJSDate(),
      null,
    );
    if (conflict) {
      throw new AppError('Horário indisponível: já existe agendamento neste intervalo.', 409);
    }

    try {
      const row = await this.appointmentRepository.create({
        clientId: input.clientId,
        barberId: input.barberId,
        startsAt: startsUtc.toJSDate(),
        endsAt: endsUtc.toJSDate(),
      });

      await this.#publishAppointmentRequested(row, barber);

      return this.#toResponse(row);
    } catch (err) {
      if (err && err.code === '23505') {
        throw new AppError('Horário indisponível: conflito ao salvar.', 409);
      }
      throw err;
    }
  }

  /**
   * @param {string} clientId
   */
  async listByClient(clientId) {
    const rows = await this.appointmentRepository.listByClientId(clientId);
    return rows.map((row) => this.#toResponse(row, true));
  }

  /**
   * @param {{ clientId: string; appointmentId: string; startsAtIso: string }} input
   */
  async rescheduleAppointment(input) {
    const row = await this.appointmentRepository.findByIdAndClientId(input.appointmentId, input.clientId);
    if (!row) {
      throw new AppError('Agendamento não encontrado.', 404);
    }
    if (row.status !== 'pending' && row.status !== 'confirmed') {
      throw new AppError('Só é possível remarcar agendamentos pendentes ou já confirmados.', 409);
    }

    const { starts, startsUtc, endsUtc } = this.#parseSlot(input.startsAtIso);

    const barber = await this.barberRepository.findActiveById(row.barber_id);
    if (!barber) {
      throw new AppError('Barbeiro não encontrado ou inativo.', 404);
    }

    this.#assertNotInPast(startsUtc);
    this.#assertWithinBusinessDay(starts);

    const conflict = await this.appointmentRepository.existsActiveAtSlot(
      row.barber_id,
      startsUtc.toJSDate(),
      endsUtc.toJSDate(),
      input.appointmentId,
    );
    if (conflict) {
      throw new AppError('Horário indisponível: já existe agendamento neste intervalo.', 409);
    }

    try {
      const updated = await this.appointmentRepository.updateSchedule(
        input.appointmentId,
        input.clientId,
        startsUtc.toJSDate(),
        endsUtc.toJSDate(),
      );
      if (!updated) {
        throw new AppError('Não foi possível remarcar o agendamento.', 409);
      }
      const withName = await this.appointmentRepository.findByIdAndClientId(input.appointmentId, input.clientId);
      return this.#toResponse(withName, true);
    } catch (err) {
      if (err && err.code === '23505') {
        throw new AppError('Horário indisponível: conflito ao salvar.', 409);
      }
      throw err;
    }
  }

  /**
   * @param {string} clientId
   * @param {string} appointmentId
   */
  async cancelAppointment(clientId, appointmentId) {
    const row = await this.appointmentRepository.cancelByClient(appointmentId, clientId);
    if (!row) {
      const existing = await this.appointmentRepository.findByIdAndClientId(appointmentId, clientId);
      if (!existing) {
        throw new AppError('Agendamento não encontrado.', 404);
      }
      throw new AppError('Só é possível cancelar agendamentos pendentes ou já confirmados.', 409);
    }
    return this.#toResponse(row, true);
  }

  /**
   * @param {{ id: string; client_id: string; barber_id: string; starts_at: Date; ends_at: Date }} row
   * @param {{ full_name: string }} barber
   */
  async #publishAppointmentRequested(row, barber) {
    const [client, barberTarget] = await Promise.all([
      this.userRepository.findById(row.client_id),
      this.barberRepository.findNotificationTargetById(row.barber_id),
    ]);

    await this.eventPublisher.publishAppointmentRequested({
      appointmentId: row.id,
      barberId: row.barber_id,
      barberName: barber.full_name,
      barberEmail: barberTarget?.email ?? null,
      clientId: row.client_id,
      clientFullName: client?.full_name ?? 'Cliente',
      startsAt: row.starts_at.toISOString(),
      endsAt: row.ends_at.toISOString(),
    });
  }

  /**
   * @param {string | undefined} startsAtIso
   */
  #parseSlot(startsAtIso) {
    if (!startsAtIso) {
      throw new AppError('startsAt é obrigatório (ISO 8601).', 422);
    }
    const starts = DateTime.fromISO(startsAtIso, { setZone: true });
    if (!starts.isValid) {
      throw new AppError('startsAt inválido. Use ISO 8601.', 422);
    }
    const startsUtc = starts.toUTC();
    const endsUtc = startsUtc.plus({ minutes: env.slotDurationMinutes });
    return { starts, startsUtc, endsUtc };
  }

  /** @param {boolean} [includeBarberName] */
  #toResponse(row, includeBarberName = false) {
    const base = {
      id: row.id,
      clientId: row.client_id,
      barberId: row.barber_id,
      startsAt: row.starts_at.toISOString(),
      endsAt: row.ends_at.toISOString(),
      status: row.status,
      createdAt: row.created_at.toISOString(),
    };
    if (includeBarberName && row.barber_full_name) {
      return { ...base, barberName: row.barber_full_name };
    }
    return base;
  }

  /**
   * Impede agendar/remarcar para um instante que já passou.
   * @param {DateTime} startsUtc
   */
  #assertNotInPast(startsUtc) {
    if (startsUtc <= DateTime.utc()) {
      throw new AppError('Não é possível agendar em um horário que já passou.', 422);
    }
  }

  /**
   * @param {DateTime} startsWithZone
   */
  #assertWithinBusinessDay(startsWithZone) {
    const local = startsWithZone.setZone(env.scheduleTimezone);
    if (isValidBookableSlotStart(local)) return;

    const dateStr = local.toFormat('yyyy-MM-dd');
    if (local.weekday === 7 && env.closedOnSunday) {
      throw new AppError('A barbearia não abre aos domingos.', 422);
    }

    throw new AppError(
      `Horário inválido: fora do expediente (${env.dayStartHour}h–${env.dayEndHour}h), intervalo de almoço ou fora da grade de ${env.slotDurationMinutes} min (data local ${dateStr}).`,
      422,
    );
  }
}
