import { AppError } from '../errors/AppError.js';
import { AppointmentRepository } from '../repositories/AppointmentRepository.js';
import { BarberRepository } from '../repositories/BarberRepository.js';

/**
 * Fila e confirmação de agendamentos pelo barbeiro autenticado.
 */
export class BarberAppointmentService {
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
   * @param {string} authUserId users.id do JWT
   * @param {string} [statusQuery] pending | confirmed | all
   */
  async listForBarber(authUserId, statusQuery) {
    const barber = await this.barberRepository.findByUserId(authUserId);
    if (!barber) {
      throw new AppError('Conta não possui perfil de barbeiro vinculado.', 403);
    }

    const filter = statusQuery ?? 'pending';
    if (!['pending', 'confirmed', 'all'].includes(filter)) {
      throw new AppError('Parâmetro status deve ser pending, confirmed ou all.', 422);
    }

    const rows = await this.appointmentRepository.listByBarberId(barber.id, filter);
    return rows.map((row) => this.#toBarberPortalRow(row));
  }

  /**
   * @param {string} authUserId
   * @param {string} appointmentId
   */
  async confirmAppointment(authUserId, appointmentId) {
    const barber = await this.barberRepository.findByUserId(authUserId);
    if (!barber) {
      throw new AppError('Conta não possui perfil de barbeiro vinculado.', 403);
    }

    const updated = await this.appointmentRepository.confirmByBarber(appointmentId, barber.id);
    if (!updated) {
      const existing = await this.appointmentRepository.findByIdAndBarberId(appointmentId, barber.id);
      if (!existing) {
        throw new AppError('Agendamento não encontrado para este barbeiro.', 404);
      }
      throw new AppError('Só é possível confirmar solicitações com status pending.', 409);
    }

    const row = await this.appointmentRepository.findByIdAndBarberId(appointmentId, barber.id);
    return this.#toBarberPortalRow(row);
  }

  #toBarberPortalRow(row) {
    return {
      id: row.id,
      clientId: row.client_id,
      barberId: row.barber_id,
      clientFullName: row.client_full_name,
      clientEmail: row.client_email,
      barberName: row.barber_full_name,
      startsAt: row.starts_at.toISOString(),
      endsAt: row.ends_at.toISOString(),
      status: row.status,
      createdAt: row.created_at.toISOString(),
    };
  }
}
