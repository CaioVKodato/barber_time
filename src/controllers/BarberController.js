import { BarberService } from '../services/BarberService.js';

/**
 * Adaptador HTTP para barbeiros (cadastro e listagem).
 */
export class BarberController {
  /** @param {BarberService} barberService */
  constructor(barberService = new BarberService()) {
    this.barberService = barberService;
  }

  register = async (req, res, next) => {
    try {
      const { email, password, fullName } = req.body ?? {};
      const result = await this.barberService.registerBarber({ email, password, fullName });
      return res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  };

  list = async (_req, res, next) => {
    try {
      const result = await this.barberService.listActiveBarbers();
      return res.status(200).json({ barbers: result });
    } catch (e) {
      next(e);
    }
  };
}
