import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Emissão e validação de tokens JWT para sessões de cliente.
 */
export class JwtService {
  /**
   * @param {{ userId: string; email: string; role: string }} payload
   */
  static sign(payload) {
    return jwt.sign(
      { sub: payload.userId, email: payload.email, role: payload.role },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn },
    );
  }

  /**
   * @param {string} token
   */
  static verify(token) {
    return jwt.verify(token, env.jwtSecret);
  }
}
