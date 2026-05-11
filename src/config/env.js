import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  scheduleTimezone: process.env.SCHEDULE_TIMEZONE ?? 'America/Sao_Paulo',
  slotDurationMinutes: Number(process.env.SLOT_DURATION_MINUTES ?? 30),
  dayStartHour: Number(process.env.DAY_START_HOUR ?? 9),
  dayEndHour: Number(process.env.DAY_END_HOUR ?? 18),
};

export function assertDatabaseUrl() {
  if (!env.databaseUrl) {
    throw new Error('Defina DATABASE_URL no arquivo .env (veja .env.example).');
  }
}
