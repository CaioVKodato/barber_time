import amqp from 'amqplib';
import { env } from '../config/env.js';
import { EXCHANGE_NAME, QUEUES, ROUTING_KEYS } from './events.js';

/**
 * Conexão e canal compartilhados com o RabbitMQ (singleton).
 */
export class RabbitMQClient {
  /** @type {RabbitMQClient | null} */
  static #instance = null;

  /** @type {import('amqplib').Connection | null} */
  #connection = null;

  /** @type {import('amqplib').Channel | null} */
  #channel = null;

  /** @type {boolean} */
  #topologyReady = false;

  static getInstance() {
    if (!RabbitMQClient.#instance) {
      RabbitMQClient.#instance = new RabbitMQClient();
    }
    return RabbitMQClient.#instance;
  }

  /**
   * @param {{ assertTopology?: boolean }} [options]
   */
  async connect(options = {}) {
    const { assertTopology = true } = options;

    if (this.#channel) {
      return this.#channel;
    }

    this.#connection = await amqp.connect(env.rabbitmqUrl);
    this.#channel = await this.#connection.createChannel();

    this.#connection.on('error', (err) => {
      console.error('[RabbitMQ] Erro na conexão:', err.message);
    });

    this.#connection.on('close', () => {
      console.warn('[RabbitMQ] Conexão encerrada.');
      this.#connection = null;
      this.#channel = null;
      this.#topologyReady = false;
    });

    if (assertTopology) {
      await this.#assertTopology();
    }

    console.log('[RabbitMQ] Conectado e topologia pronta.');
    return this.#channel;
  }

  async #assertTopology() {
    if (!this.#channel || this.#topologyReady) return;

    await this.#channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

    await this.#channel.assertQueue(QUEUES.BARBER_NEW_APPOINTMENT, { durable: true });
    await this.#channel.bindQueue(
      QUEUES.BARBER_NEW_APPOINTMENT,
      EXCHANGE_NAME,
      ROUTING_KEYS.APPOINTMENT_REQUESTED,
    );

    await this.#channel.assertQueue(QUEUES.CLIENT_APPOINTMENT_CONFIRMED, { durable: true });
    await this.#channel.bindQueue(
      QUEUES.CLIENT_APPOINTMENT_CONFIRMED,
      EXCHANGE_NAME,
      ROUTING_KEYS.APPOINTMENT_CONFIRMED,
    );

    await this.#channel.assertQueue(QUEUES.CLIENT_APPOINTMENT_REJECTED, { durable: true });
    await this.#channel.bindQueue(
      QUEUES.CLIENT_APPOINTMENT_REJECTED,
      EXCHANGE_NAME,
      ROUTING_KEYS.APPOINTMENT_REJECTED,
    );

    this.#topologyReady = true;
  }

  /** @returns {import('amqplib').Channel} */
  getChannel() {
    if (!this.#channel) {
      throw new Error('RabbitMQ não conectado. Chame connect() antes de publicar ou consumir.');
    }
    return this.#channel;
  }

  isConnected() {
    return Boolean(this.#channel);
  }

  async close() {
    try {
      await this.#channel?.close();
    } catch {
      /* canal já fechado */
    }
    try {
      await this.#connection?.close();
    } catch {
      /* conexão já fechada */
    }
    this.#channel = null;
    this.#connection = null;
    this.#topologyReady = false;
  }
}
