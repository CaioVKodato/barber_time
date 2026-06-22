import { RabbitMQClient } from '../messaging/RabbitMQClient.js';
import { NotificationConsumer } from '../messaging/consumers/NotificationConsumer.js';

const rabbitClient = RabbitMQClient.getInstance();
const consumer = new NotificationConsumer(rabbitClient);

async function main() {
  await consumer.start();
  console.log('[Worker] Notification worker em execução. Aguardando eventos...');
}

async function shutdown(signal) {
  console.log(`[Worker] Encerrando (${signal})...`);
  await rabbitClient.close();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

main().catch((err) => {
  console.error('[Worker] Falha ao iniciar:', err);
  process.exit(1);
});
