import { AvailabilityService } from '../services/AvailabilityService.js';

/**
 * Adaptador HTTP para consulta de horários livres.
 */
export class AvailabilityController {
  /** @param {AvailabilityService} availabilityService */
  constructor(availabilityService = new AvailabilityService()) {
    this.availabilityService = availabilityService;
  }

  listAvailable = async (req, res, next) => {
    try {
      const { barberId, date } = req.query;
      const result = await this.availabilityService.listAvailableSlots({
        barberId: typeof barberId === 'string' ? barberId : undefined,
        date: typeof date === 'string' ? date : undefined,
      });
      return res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };
}
