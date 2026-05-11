import { DateTime } from 'luxon';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { AppointmentRepository } from '../repositories/AppointmentRepository.js';
import { BarberRepository } from '../repositories/BarberRepository.js';

/**
 * Criação de agendamentos com validação de conflito de horário.
 */
export class AppointmentService {
  /**
   * @param {AppointmentRepository} appointmentRepository
   * @param {BarberRepository} barberRepository
   */
  constructor(
    appointmentRepository = new AppointmentRepository(),
    barberRepository = new BarberRepository(),
  ) {
    this.appointmentRepository = appointmentRepository;
    this.barberRepository = barberRepository;
  }

  /**
   * @param {{ clientId: string; barberId: string; startsAtIso: string }} input startsAt em ISO8601 (instante único UTC ou com offset)
   */
  async scheduleHaircut(input) {
    if (!input.barberId) {
      throw new AppError('barberId é obrigatório.', 422);
    }
    if (!input.startsAtIso) {
      throw new AppError('startsAt é obrigatório (ISO 8601).', 422);
    }

    const starts = DateTime.fromISO(input.startsAtIso, { setZone: true });
    if (!starts.isValid) {
      throw new AppError('startsAt inválido. Use ISO 8601.', 422);
    }

    const startsUtc = starts.toUTC();
    const endsUtc = startsUtc.plus({ minutes: env.slotDurationMinutes });

    const barber = await this.barberRepository.findActiveById(input.barberId);
    if (!barber) {
      throw new AppError('Barbeiro não encontrado ou inativo.', 404);
    }

    this.#assertWithinBusinessDay(starts);

    const conflict = await this.appointmentRepository.existsActiveAtSlot(
      input.barberId,
      startsUtc.toJSDate(),
      endsUtc.toJSDate(),
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
      return this.#toResponse(row);
    } catch (err) {
      if (err && err.code === '23505') {
        throw new AppError('Horário indisponível: conflito ao salvar.', 409);
      }
      throw err;
    }
  }

  #toResponse(row) {
    return {
      id: row.id,
      clientId: row.client_id,
      barberId: row.barber_id,
      startsAt: row.starts_at.toISOString(),
      endsAt: row.ends_at.toISOString(),
      status: row.status,
      createdAt: row.created_at.toISOString(),
    };
  }

  /**
   * Garante que o início do slot pertence ao dia de expediente configurado (fuso America/Sao_Paulo por padrão).
   * @param {DateTime} startsWithZone
   */
  #assertWithinBusinessDay(startsWithZone) {
    const local = startsWithZone.setZone(env.scheduleTimezone);
    const open = local.set({ hour: env.dayStartHour, minute: 0, second: 0, millisecond: 0 });
    const close = local.set({ hour: env.dayEndHour, minute: 0, second: 0, millisecond: 0 });

    if (local < open || local >= close) {
      throw new AppError('Horário fora do expediente configurado para a barbearia.', 422);
    }

    if (local.minute % env.slotDurationMinutes !== 0 || local.second !== 0 || local.millisecond !== 0) {
      throw new AppError(`startsAt deve alinhar à grade de ${env.slotDurationMinutes} minutos (ex.: 09:00, 09:30).`, 422);
    }
  }
}
