import { JwtService } from '../utils/JwtService.js';
import { AppError } from '../errors/AppError.js';

/**
 * Exige Authorization: Bearer <jwt> e injeta req.auth.
 */
export function authMiddleware(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Token não informado.', 401));
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return next(new AppError('Token não informado.', 401));
  }

  try {
    const decoded = JwtService.verify(token);
    req.auth = {
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    return next();
  } catch {
    return next(new AppError('Token inválido ou expirado.', 401));
  }
}
