import nodemailer from 'nodemailer';
import { DateTime } from 'luxon';

import { env } from '../config/env.js';

/**
 * Envio de e-mails transacionais via SMTP (ex.: Gmail + senha de app).
 */
export class EmailService {
  /** @type {import('nodemailer').Transporter | null} */
  #transporter = null;

  constructor() {
    if (env.emailEnabled && env.smtpUser && env.smtpPass) {
      this.#transporter = nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: env.smtpSecure,
        auth: {
          user: env.smtpUser,
          pass: env.smtpPass,
        },
      });
    }
  }

  /** Valida login SMTP na subida (falha cedo se senha de app estiver errada). */
  async verifyConnection() {
    if (!this.#transporter) return false;
    await this.#transporter.verify();
    return true;
  }

  isReady() {
    return env.emailEnabled && this.#transporter !== null;
  }

  /**
   * @param {string} startsAtIso
   * @param {string} endsAtIso
   */
  #formatSlot(startsAtIso, endsAtIso) {
    const start = DateTime.fromISO(startsAtIso, { zone: 'utc' }).setZone(env.scheduleTimezone);
    const end = DateTime.fromISO(endsAtIso, { zone: 'utc' }).setZone(env.scheduleTimezone);
    return `${start.toFormat('dd/MM/yyyy HH:mm')} – ${end.toFormat('HH:mm')}`;
  }

  /**
   * @param {{ to: string; barberName: string; clientFullName: string; startsAt: string; endsAt: string; appointmentId: string }} input
   */
  async sendBarberNewAppointment(input) {
    if (!this.#transporter) return;

    const slot = this.#formatSlot(input.startsAt, input.endsAt);
    const subject = 'BarberTime — Nova solicitação de agendamento';
    const text = [
      `Olá, ${input.barberName}!`,
      '',
      `${input.clientFullName} solicitou um horário na barbearia.`,
      `Horário: ${slot}`,
      `ID do agendamento: ${input.appointmentId}`,
      '',
      'Acesse o app ou a API para confirmar o pedido.',
    ].join('\n');

    await this.#transporter.sendMail({
      from: env.emailFrom,
      to: input.to,
      subject,
      text,
      html: `<p>Olá, <strong>${input.barberName}</strong>!</p>
<p><strong>${input.clientFullName}</strong> solicitou um horário na barbearia.</p>
<p><strong>Horário:</strong> ${slot}<br/>
<strong>ID:</strong> ${input.appointmentId}</p>
<p>Acesse o app ou a API para confirmar o pedido.</p>`,
    });
  }

  /**
   * @param {{ to: string; clientFullName: string; barberName: string; startsAt: string; endsAt: string; appointmentId: string }} input
   */
  async sendClientAppointmentConfirmed(input) {
    if (!this.#transporter) return;

    const slot = this.#formatSlot(input.startsAt, input.endsAt);
    const subject = 'BarberTime — Agendamento confirmado';
    const text = [
      `Olá, ${input.clientFullName}!`,
      '',
      `Seu horário com ${input.barberName} foi confirmado.`,
      `Horário: ${slot}`,
      `ID do agendamento: ${input.appointmentId}`,
      '',
      'Até lá!',
    ].join('\n');

    await this.#transporter.sendMail({
      from: env.emailFrom,
      to: input.to,
      subject,
      text,
      html: `<p>Olá, <strong>${input.clientFullName}</strong>!</p>
<p>Seu horário com <strong>${input.barberName}</strong> foi <strong>confirmado</strong>.</p>
<p><strong>Horário:</strong> ${slot}<br/>
<strong>ID:</strong> ${input.appointmentId}</p>
<p>Até lá!</p>`,
    });
  }
}
