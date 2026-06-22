import dotenv from 'dotenv';

dotenv.config();

function parseBool(v, defaultValue) {
  if (v === undefined || v === '') return defaultValue;
  return !['0', 'false', 'no', 'off'].includes(String(v).toLowerCase());
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  scheduleTimezone: process.env.SCHEDULE_TIMEZONE ?? 'America/Sao_Paulo',
  slotDurationMinutes: Number(process.env.SLOT_DURATION_MINUTES ?? 30),
  dayStartHour: Number(process.env.DAY_START_HOUR ?? 9),
  dayStartMinute: Number(process.env.DAY_START_MINUTE ?? 0),
  dayEndHour: Number(process.env.DAY_END_HOUR ?? 20),
  dayEndMinute: Number(process.env.DAY_END_MINUTE ?? 0),
  /** Fechado aos domingos (weekday Luxon 7) */
  closedOnSunday: parseBool(process.env.CLOSED_ON_SUNDAY, true),
  lunchStartHour: Number(process.env.LUNCH_START_HOUR ?? 12),
  lunchStartMinute: Number(process.env.LUNCH_START_MINUTE ?? 0),
  lunchEndHour: Number(process.env.LUNCH_END_HOUR ?? 13),
  lunchEndMinute: Number(process.env.LUNCH_END_MINUTE ?? 0),
  /** Desative com LUNCH_BREAK_ENABLED=false ou início >= fim */
  lunchBreakEnabled: (() => {
    const raw = process.env.LUNCH_BREAK_ENABLED;
    if (raw !== undefined && raw !== '') {
      return parseBool(raw, true);
    }
    const sh = Number(process.env.LUNCH_START_HOUR ?? 12);
    const sm = Number(process.env.LUNCH_START_MINUTE ?? 0);
    const eh = Number(process.env.LUNCH_END_HOUR ?? 13);
    const em = Number(process.env.LUNCH_END_MINUTE ?? 0);
    return sh < eh || (sh === eh && sm < em);
  })(),
  rabbitmqUrl: process.env.RABBITMQ_URL ?? 'amqp://barbertime:barbertime@localhost:5673',
  rabbitmqEnabled: parseBool(process.env.RABBITMQ_ENABLED, true),
  /** E-mail SMTP (Gmail: senha de app em https://myaccount.google.com/apppasswords) */
  emailEnabled: parseBool(process.env.EMAIL_ENABLED, false),
  smtpHost: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: parseBool(process.env.SMTP_SECURE, false),
  smtpUser: (process.env.SMTP_USER ?? '').trim(),
  smtpPass: (process.env.SMTP_PASS ?? '').replace(/\s/g, ''),
  emailFrom: process.env.EMAIL_FROM ?? process.env.SMTP_USER ?? 'BarberTime <noreply@local>',
};

export function assertDatabaseUrl() {
  if (!env.databaseUrl) {
    throw new Error('Defina DATABASE_URL no arquivo .env (veja .env.example).');
  }
}
