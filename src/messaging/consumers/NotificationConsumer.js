import { QUEUES } from '../events.js';
import { RabbitMQClient } from '../RabbitMQClient.js';

/**
 * Consome filas de notificação e simula o envio ao barbeiro/cliente (log).
 * Processo separado da API REST — comunicação assíncrona via MOM.
 */
export class NotificationConsumer {
  /**
   * @param {RabbitMQClient} [rabbitClient]
   */
  constructor(rabbitClient = RabbitMQClient.getInstance()) {
    this.rabbitClient = rabbitClient;
  }

  async start() {
    const channel = await this.rabbitClient.connect();

    await channel.prefetch(1);

    await channel.consume(QUEUES.BARBER_NEW_APPOINTMENT, (msg) => {
      if (!msg) return;
      this.#handleBarberNotification(msg, channel);
    });

    await channel.consume(QUEUES.CLIENT_APPOINTMENT_CONFIRMED, (msg) => {
      if (!msg) return;
      this.#handleClientNotification(msg, channel);
    });

    console.log('[NotificationConsumer] Ouvindo filas:');
    console.log(`  - ${QUEUES.BARBER_NEW_APPOINTMENT}`);
    console.log(`  - ${QUEUES.CLIENT_APPOINTMENT_CONFIRMED}`);
  }

  /**
   * @param {import('amqplib').ConsumeMessage} msg
   * @param {import('amqplib').Channel} channel
   */
  #handleBarberNotification(msg, channel) {
    try {
      const envelope = JSON.parse(msg.content.toString());
      const p = envelope.payload;

      console.log('────────────────────────────────────────────────────────');
      console.log('[NOTIFICAÇÃO → BARBEIRO] Nova solicitação de agendamento');
      console.log(`  Evento:     ${envelope.eventType} (${envelope.eventId})`);
      console.log(`  Barbeiro:   ${p.barberName} <${p.barberEmail ?? 'sem e-mail vinculado'}>`);
      console.log(`  Cliente:    ${p.clientFullName}`);
      console.log(`  Horário:    ${p.startsAt} → ${p.endsAt}`);
      console.log(`  ID agend.:  ${p.appointmentId}`);
      console.log('  Ação simulada: push/e-mail ao app do prestador');
      console.log('────────────────────────────────────────────────────────');

      channel.ack(msg);
    } catch (err) {
      console.error('[NotificationConsumer] Erro ao processar mensagem (barbeiro):', err);
      channel.nack(msg, false, false);
    }
  }

  /**
   * @param {import('amqplib').ConsumeMessage} msg
   * @param {import('amqplib').Channel} channel
   */
  #handleClientNotification(msg, channel) {
    try {
      const envelope = JSON.parse(msg.content.toString());
      const p = envelope.payload;

      console.log('────────────────────────────────────────────────────────');
      console.log('[NOTIFICAÇÃO → CLIENTE] Agendamento confirmado pelo barbeiro');
      console.log(`  Evento:     ${envelope.eventType} (${envelope.eventId})`);
      console.log(`  Cliente:    ${p.clientFullName} <${p.clientEmail}>`);
      console.log(`  Barbeiro:   ${p.barberName}`);
      console.log(`  Horário:    ${p.startsAt} → ${p.endsAt}`);
      console.log(`  ID agend.:  ${p.appointmentId}`);
      console.log('  Ação simulada: push/e-mail ao app do cliente');
      console.log('────────────────────────────────────────────────────────');

      channel.ack(msg);
    } catch (err) {
      console.error('[NotificationConsumer] Erro ao processar mensagem (cliente):', err);
      channel.nack(msg, false, false);
    }
  }
}
