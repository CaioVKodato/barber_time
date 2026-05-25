import { createApp } from './app.js';
import { env, assertDatabaseUrl } from './config/env.js';
import { RabbitMQClient } from './messaging/RabbitMQClient.js';

assertDatabaseUrl();

const app = createApp();
const rabbitClient = RabbitMQClient.getInstance();

async function bootstrap() {
  if (env.rabbitmqEnabled) {
    try {
      await rabbitClient.connect();
    } catch (err) {
      console.error(
        '[RabbitMQ] API iniciará sem broker. Verifique docker compose up e RABBITMQ_URL.',
        err instanceof Error ? err.message : err,
      );
    }
  } else {
    console.log('[RabbitMQ] Desabilitado (RABBITMQ_ENABLED=false).');
  }

  app.listen(env.port, () => {
    console.log(`BarberTime API ouvindo na porta ${env.port}`);
  });
}

async function shutdown(signal) {
  console.log(`Encerrando API (${signal})...`);
  await rabbitClient.close();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

bootstrap().catch((err) => {
  console.error('Falha ao iniciar API:', err);
  process.exit(1);
});
