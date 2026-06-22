import { AppError } from '../errors/AppError.js';

/**
 * Tratamento centralizado de erros HTTP.
 */
export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code ?? undefined,
    });
  }

  console.error(err);
  return res.status(500).json({
    error: 'Erro interno no servidor.',
  });
}
