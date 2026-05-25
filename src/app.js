import express from 'express';
import { env } from './config/env.js';
import { RabbitMQClient } from './messaging/RabbitMQClient.js';
import { createApiRouter } from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

/**
 * Configuração da aplicação Express (sem escutar porta).
 */
export function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'barbertime-api',
      rabbitmq: {
        enabled: env.rabbitmqEnabled,
        connected: RabbitMQClient.getInstance().isConnected(),
      },
    });
  });

  app.use('/api/v1', createApiRouter());

  app.use(errorHandler);

  return app;
}
