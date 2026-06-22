import { DateTime, Interval } from 'luxon';
import { env } from '../config/env.js';
import { getBookableSlotStartsLocal, isClosedOnThisDate, parseBusinessDate } from '../domain/schedulePolicy.js';
import { AppError } from '../errors/AppError.js';
import { AppointmentRepository } from '../repositories/AppointmentRepository.js';
import { BarberRepository } from '../repositories/BarberRepository.js';

/**
 * Calcula janelas livres na grade (dia + duração fixa do slot).
 * Só considera ocupação de agendamentos `pending` ou `confirmed`.
 */
export class AvailabilityService {
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
   * @param {{ barberId: string; date: string }} query date no formato YYYY-MM-DD (calendário no fuso configurado)
   */
  async listAvailableSlots(query) {
    if (!query.barberId) {
      throw new AppError('barberId é obrigatório.', 422);
    }
    this.#assertDate(query.date);

    const barber = await this.barberRepository.findActiveById(query.barberId);
    if (!barber) {
      throw new AppError('Barbeiro não encontrado ou inativo.', 404);
    }

    return this.#buildSlotsPayload(barber.id, barber.full_name, query.date);
  }

  /**
   * Visão do dia: todos os barbeiros ativos com respectivos horários livres (sem front).
   * @param {string} dateStr YYYY-MM-DD
   */
  async listDayOverview(dateStr) {
    this.#assertDate(dateStr);
    const barbers = await this.barberRepository.listActive();
    const barbersPayload = [];
    for (const b of barbers) {
      barbersPayload.push(await this.#buildSlotsPayload(b.id, b.full_name, dateStr));
    }
    const day = parseBusinessDate(dateStr);
    return {
      date: dateStr,
      slotDurationMinutes: env.slotDurationMinutes,
      timezone: env.scheduleTimezone,
      closedToday: isClosedOnThisDate(day),
      closedReason: isClosedOnThisDate(day) ? 'sunday' : null,
      barbers: barbersPayload,
    };
  }

  #assertDate(date) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new AppError('date deve estar no formato YYYY-MM-DD.', 422);
    }
  }

  /**
   * @param {string} barberId
   * @param {string} barberName
   * @param {string} date
   */
  async #buildSlotsPayload(barberId, barberName, date) {
    const zone = env.scheduleTimezone;
    const d = parseBusinessDate(date);
    if (!d.isValid) {
      throw new AppError('Parâmetros de data/horário inválidos.', 422);
    }

    const dayStart = d.set({
      hour: env.dayStartHour,
      minute: env.dayStartMinute,
      second: 0,
      millisecond: 0,
    });
    const dayEnd = d.set({
      hour: env.dayEndHour,
      minute: env.dayEndMinute,
      second: 0,
      millisecond: 0,
    });

    if (dayEnd <= dayStart) {
      throw new AppError('Parâmetros de data/horário inválidos.', 422);
    }

    const rangeStart = dayStart.toUTC();
    const rangeEnd = dayEnd.toUTC();

    const booked = await this.appointmentRepository.listBookedRanges(
      barberId,
      rangeStart.toJSDate(),
      rangeEnd.toJSDate(),
    );

    const bookedIntervals = booked.map((b) =>
      Interval.fromDateTimes(DateTime.fromJSDate(b.startsAt, { zone: 'utc' }), DateTime.fromJSDate(b.endsAt, { zone: 'utc' })),
    );

    const slotMinutes = env.slotDurationMinutes;
    const available = [];
    const slotStarts = getBookableSlotStartsLocal(date);
    const nowUtc = DateTime.utc();

    for (const cursor of slotStarts) {
      const slotStartUtc = cursor.toUTC();
      const slotEndUtc = cursor.plus({ minutes: slotMinutes }).toUTC();

      // Não oferecer horários cujo início já passou (relevante para o dia atual).
      if (slotStartUtc <= nowUtc) continue;

      const slotInterval = Interval.fromDateTimes(slotStartUtc, slotEndUtc);

      const overlaps = bookedIntervals.some((bi) => bi.isValid && slotInterval.overlaps(bi));
      if (!overlaps) {
        available.push({
          startsAt: slotStartUtc.toISO(),
          endsAt: slotEndUtc.toISO(),
          timezone: zone,
        });
      }
    }

    return {
      barberId,
      barberName,
      date,
      slotDurationMinutes: slotMinutes,
      closedToday: isClosedOnThisDate(d),
      closedReason: isClosedOnThisDate(d) ? 'sunday' : null,
      availableSlots: available,
    };
  }
}
