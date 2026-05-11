import { AppointmentService } from '../services/AppointmentService.js';

/**
 * Adaptador HTTP para agendamentos do cliente.
 */
export class AppointmentController {
  /** @param {AppointmentService} appointmentService */
  constructor(appointmentService = new AppointmentService()) {
    this.appointmentService = appointmentService;
  }

  schedule = async (req, res, next) => {
    try {
      const { barberId, startsAt } = req.body ?? {};
      const result = await this.appointmentService.scheduleHaircut({
        clientId: req.auth.userId,
        barberId,
        startsAtIso: startsAt,
      });
      return res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  };
}
