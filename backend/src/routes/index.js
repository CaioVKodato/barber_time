import { Router } from 'express';
import { createAuthRoutes } from './authRoutes.js';
import { createAvailabilityRoutes } from './availabilityRoutes.js';
import { createAppointmentRoutes } from './appointmentRoutes.js';
import { createBarberRoutes } from './barberRoutes.js';
import { createBarberPortalRoutes } from './barberPortalRoutes.js';

export function createApiRouter() {
  const router = Router();

  router.use('/auth', createAuthRoutes());
  router.use('/barbers', createBarberRoutes());
  router.use('/barber', createBarberPortalRoutes());
  router.use('/availability', createAvailabilityRoutes());
  router.use('/appointments', createAppointmentRoutes());

  return router;
}
