import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { EVENT_TYPES, EXCHANGE_NAME, ROUTING_KEYS } from './events.js';
import { RabbitMQClient } from './RabbitMQClient.js';

/**
 * Publica eventos de domínio no exchange topic do RabbitMQ.
 * Falhas de publicação são registradas em log sem reverter a operação REST.
 */
export class EventPublisher {
  /**
   * @param {RabbitMQClient} [rabbitClient]
   */
  constructor(rabbitClient = RabbitMQClient.getInstance()) {
    this.rabbitClient = rabbitClient;
  }

  /**
   * @param {{ appointmentId: string; barberId: string; barberName: string; barberEmail: string | null; clientId: string; clientFullName: string; startsAt: string; endsAt: string }} data
   */
  async publishAppointmentRequested(data) {
    const envelope = this.#buildEnvelope(EVENT_TYPES.APPOINTMENT_REQUESTED, data);
    await this.#publish(ROUTING_KEYS.APPOINTMENT_REQUESTED, envelope);
  }

  /**
   * @param {{ appointmentId: string; clientId: string; clientFullName: string; clientEmail: string; barberId: string; barberName: string; startsAt: string; endsAt: string }} data
   */
  async publishAppointmentConfirmed(data) {
    const envelope = this.#buildEnvelope(EVENT_TYPES.APPOINTMENT_CONFIRMED, data);
    await this.#publish(ROUTING_KEYS.APPOINTMENT_CONFIRMED, envelope);
  }

  /**
   * @param {{ appointmentId: string; clientId: string; clientFullName: string; clientEmail: string; barberId: string; barberName: string; startsAt: string; endsAt: string }} data
   */
  async publishAppointmentRejected(data) {
    const envelope = this.#buildEnvelope(EVENT_TYPES.APPOINTMENT_REJECTED, data);
    await this.#publish(ROUTING_KEYS.APPOINTMENT_REJECTED, envelope);
  }

  /**
   * @param {string} eventType
   * @param {Record<string, unknown>} payload
   */
  #buildEnvelope(eventType, payload) {
    return {
      eventType,
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      source: 'barbertime-api',
      payload,
    };
  }

  /**
   * @param {string} routingKey
   * @param {Record<string, unknown>} envelope
   */
  async #publish(routingKey, envelope) {
    if (!env.rabbitmqEnabled) {
      console.log(`[RabbitMQ] Publicação ignorada (RABBITMQ_ENABLED=false): ${routingKey}`);
      return;
    }

    try {
      if (!this.rabbitClient.isConnected()) {
        await this.rabbitClient.connect();
      }

      const channel = this.rabbitClient.getChannel();
      const body = Buffer.from(JSON.stringify(envelope));

      channel.publish(EXCHANGE_NAME, routingKey, body, {
        contentType: 'application/json',
        persistent: true,
        messageId: String(envelope.eventId),
        timestamp: Date.now(),
      });

      console.log(`[RabbitMQ] Evento publicado: ${envelope.eventType} (${envelope.eventId})`);
    } catch (err) {
      console.error(
        `[RabbitMQ] Falha ao publicar ${routingKey}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}
