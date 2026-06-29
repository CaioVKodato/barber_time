/** Exchange topic para eventos de domínio do BarberTime. */
export const EXCHANGE_NAME = 'barbertime.events';

/** Filas consumidas pelo worker de notificações. */
export const QUEUES = {
  BARBER_NEW_APPOINTMENT: 'barbertime.notifications.barber',
  CLIENT_APPOINTMENT_CONFIRMED: 'barbertime.notifications.client',
  CLIENT_APPOINTMENT_REJECTED: 'barbertime.notifications.client.rejected',
};

/** Routing keys publicadas pelo backend REST. */
export const ROUTING_KEYS = {
  APPOINTMENT_REQUESTED: 'appointment.requested',
  APPOINTMENT_CONFIRMED: 'appointment.confirmed',
  APPOINTMENT_REJECTED: 'appointment.rejected',
};

export const EVENT_TYPES = {
  APPOINTMENT_REQUESTED: 'appointment.requested',
  APPOINTMENT_CONFIRMED: 'appointment.confirmed',
  APPOINTMENT_REJECTED: 'appointment.rejected',
};
