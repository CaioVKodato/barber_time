import { BarberAppointmentService } from '../services/BarberAppointmentService.js';

/**
 * Rotas do barbeiro: fila e confirmação.
 */
export class BarberAppointmentController {
  /** @param {BarberAppointmentService} service */
  constructor(service = new BarberAppointmentService()) {
    this.service = service;
  }

  list = async (req, res, next) => {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const items = await this.service.listForBarber(req.auth.userId, status);
      return res.status(200).json({ appointments: items });
    } catch (e) {
      next(e);
    }
  };

  confirm = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.service.confirmAppointment(req.auth.userId, id);
      return res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };
}
