import { DateTime, Interval } from 'luxon';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { AppointmentRepository } from '../repositories/AppointmentRepository.js';
import { BarberRepository } from '../repositories/BarberRepository.js';

/**
 * Calcula janelas livres na grade (dia útil + duração fixa do slot).
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
    if (!query.date || !/^\d{4}-\d{2}-\d{2}$/.test(query.date)) {
      throw new AppError('date deve estar no formato YYYY-MM-DD.', 422);
    }

    const barber = await this.barberRepository.findActiveById(query.barberId);
    if (!barber) {
      throw new AppError('Barbeiro não encontrado ou inativo.', 404);
    }

    const zone = env.scheduleTimezone;
    const dayStart = DateTime.fromISO(`${query.date}T00:00:00`, { zone }).set({
      hour: env.dayStartHour,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const dayEnd = DateTime.fromISO(`${query.date}T00:00:00`, { zone }).set({
      hour: env.dayEndHour,
      minute: 0,
      second: 0,
      millisecond: 0,
    });

    if (!dayStart.isValid || !dayEnd.isValid || dayEnd <= dayStart) {
      throw new AppError('Parâmetros de data/horário inválidos.', 422);
    }

    const rangeStart = dayStart.toUTC();
    const rangeEnd = dayEnd.toUTC();

    const booked = await this.appointmentRepository.listBookedRanges(
      query.barberId,
      rangeStart.toJSDate(),
      rangeEnd.toJSDate(),
    );

    const bookedIntervals = booked.map((b) =>
      Interval.fromDateTimes(DateTime.fromJSDate(b.startsAt, { zone: 'utc' }), DateTime.fromJSDate(b.endsAt, { zone: 'utc' })),
    );

    const slotMinutes = env.slotDurationMinutes;
    const available = [];

    for (let cursor = dayStart; cursor.plus({ minutes: slotMinutes }) <= dayEnd; cursor = cursor.plus({ minutes: slotMinutes })) {
      const slotStartUtc = cursor.toUTC();
      const slotEndUtc = cursor.plus({ minutes: slotMinutes }).toUTC();
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
      barberId: barber.id,
      barberName: barber.full_name,
      date: query.date,
      slotDurationMinutes: slotMinutes,
      availableSlots: available,
    };
  }
}
