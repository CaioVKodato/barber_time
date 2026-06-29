import { env } from '../../config/env.js';
import { EmailService } from '../../notifications/EmailService.js';
import { QUEUES } from '../events.js';
import { RabbitMQClient } from '../RabbitMQClient.js';

/**
 * Consome filas de notificação: log + e-mail SMTP (quando configurado).
 * Processo separado da API REST — comunicação assíncrona via MOM.
 */
export class NotificationConsumer {
  /**
   * @param {RabbitMQClient} [rabbitClient]
   * @param {EmailService} [emailService]
   */
  constructor(rabbitClient = RabbitMQClient.getInstance(), emailService = new EmailService()) {
    this.rabbitClient = rabbitClient;
    this.emailService = emailService;
  }

  async start() {
    const channel = await this.rabbitClient.connect();

    await channel.prefetch(1);

    await channel.consume(QUEUES.BARBER_NEW_APPOINTMENT, (msg) => {
      if (!msg) return;
      void this.#handleBarberNotification(msg, channel);
    });

    await channel.consume(QUEUES.CLIENT_APPOINTMENT_CONFIRMED, (msg) => {
      if (!msg) return;
      void this.#handleClientNotification(msg, channel);
    });

    await channel.consume(QUEUES.CLIENT_APPOINTMENT_REJECTED, (msg) => {
      if (!msg) return;
      void this.#handleClientRejection(msg, channel);
    });

    console.log('[NotificationConsumer] Ouvindo filas:');
    console.log(`  - ${QUEUES.BARBER_NEW_APPOINTMENT}`);
    console.log(`  - ${QUEUES.CLIENT_APPOINTMENT_CONFIRMED}`);
    console.log(`  - ${QUEUES.CLIENT_APPOINTMENT_REJECTED}`);
    if (this.emailService.isReady()) {
      try {
        await this.emailService.verifyConnection();
        console.log('[NotificationConsumer] E-mail SMTP ativo (remetente:', env.emailFrom, ')');
      } catch (err) {
        console.error('[NotificationConsumer] SMTP configurado mas login falhou:', err.message);
        console.error('  Gere nova senha de app: https://myaccount.google.com/apppasswords');
      }
    } else if (env.emailEnabled) {
      console.warn('[NotificationConsumer] EMAIL_ENABLED=true mas SMTP incompleto — só log, sem envio.');
    } else {
      console.log('[NotificationConsumer] E-mail desabilitado (EMAIL_ENABLED=false) — só log.');
    }
  }

  /**
   * @param {import('amqplib').ConsumeMessage} msg
   * @param {import('amqplib').Channel} channel
   */
  async #handleBarberNotification(msg, channel) {
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

      if (this.emailService.isReady() && p.barberEmail) {
        await this.#trySendEmail(() =>
          this.emailService.sendBarberNewAppointment({
            to: p.barberEmail,
            barberName: p.barberName,
            clientFullName: p.clientFullName,
            startsAt: p.startsAt,
            endsAt: p.endsAt,
            appointmentId: p.appointmentId,
          }),
          p.barberEmail,
        );
      } else if (this.emailService.isReady() && !p.barberEmail) {
        console.log('  E-mail não enviado: barbeiro sem e-mail vinculado.');
      }

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
  async #handleClientNotification(msg, channel) {
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

      if (this.emailService.isReady() && p.clientEmail) {
        await this.#trySendEmail(() =>
          this.emailService.sendClientAppointmentConfirmed({
            to: p.clientEmail,
            clientFullName: p.clientFullName,
            barberName: p.barberName,
            startsAt: p.startsAt,
            endsAt: p.endsAt,
            appointmentId: p.appointmentId,
          }),
          p.clientEmail,
        );
      }

      console.log('────────────────────────────────────────────────────────');

      channel.ack(msg);
    } catch (err) {
      console.error('[NotificationConsumer] Erro ao processar mensagem (cliente):', err);
      channel.nack(msg, false, false);
    }
  }

  /**
   * @param {import('amqplib').ConsumeMessage} msg
   * @param {import('amqplib').Channel} channel
   */
  async #handleClientRejection(msg, channel) {
    try {
      const envelope = JSON.parse(msg.content.toString());
      const p = envelope.payload;

      console.log('────────────────────────────────────────────────────────');
      console.log('[NOTIFICAÇÃO → CLIENTE] Solicitação recusada pelo barbeiro');
      console.log(`  Evento:     ${envelope.eventType} (${envelope.eventId})`);
      console.log(`  Cliente:    ${p.clientFullName} <${p.clientEmail}>`);
      console.log(`  Barbeiro:   ${p.barberName}`);
      console.log(`  Horário:    ${p.startsAt} → ${p.endsAt}`);
      console.log(`  ID agend.:  ${p.appointmentId}`);

      if (this.emailService.isReady() && p.clientEmail) {
        await this.#trySendEmail(() =>
          this.emailService.sendClientAppointmentRejected({
            to: p.clientEmail,
            clientFullName: p.clientFullName,
            barberName: p.barberName,
            startsAt: p.startsAt,
            endsAt: p.endsAt,
            appointmentId: p.appointmentId,
          }),
          p.clientEmail,
        );
      }

      console.log('────────────────────────────────────────────────────────');

      channel.ack(msg);
    } catch (err) {
      console.error('[NotificationConsumer] Erro ao processar mensagem (recusa):', err);
      channel.nack(msg, false, false);
    }
  }

  /**
   * @param {() => Promise<void>} send
   * @param {string} to
   */
  async #trySendEmail(send, to) {
    try {
      await send();
      console.log(`  E-mail enviado para: ${to}`);
    } catch (err) {
      console.error(`  Falha ao enviar e-mail para ${to}:`, err.message);
    }
  }
}
