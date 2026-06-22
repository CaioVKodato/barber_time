import { AuthService } from '../services/AuthService.js';

/**
 * Adaptador HTTP para autenticação.
 */
export class AuthController {
  /** @param {AuthService} authService */
  constructor(authService = new AuthService()) {
    this.authService = authService;
  }

  register = async (req, res, next) => {
    try {
      const { email, password, fullName } = req.body ?? {};
      const result = await this.authService.registerClient({ email, password, fullName });
      return res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body ?? {};
      const result = await this.authService.login({ email, password });
      return res.status(200).json(result);
    } catch (e) {
      next(e);
    }
  };
}
