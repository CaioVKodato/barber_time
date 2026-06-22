import { AppError } from '../errors/AppError.js';

/**
 * Restringe rota a papéis JWT específicos (após authMiddleware).
 * @param {...string} roles
 */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.auth) {
      return next(new AppError('Não autenticado.', 401));
    }
    if (!roles.includes(req.auth.role)) {
      return next(new AppError('Acesso negado para este perfil.', 403));
    }
    return next();
  };
}
