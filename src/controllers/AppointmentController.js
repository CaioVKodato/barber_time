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

  listMine = async (req, res, next) => {
    try {
      const items = await this.appointmentService.listByClient(req.auth.userId);
      return res.status(200).json({ appointments: items });
    } catch (e) {
      next(e);
    }
  };

  reschedule = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { startsAt } = req.body ?? {};
      const result = await this.appointmentService.rescheduleAppointment({
        clientId: req.auth.userId,
        appointmentId: id,
        startsAtIso: startsAt,
      });
      return res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };

  cancel = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.appointmentService.cancelAppointment(req.auth.userId, id);
      return res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };
}
