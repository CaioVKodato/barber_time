import { Router } from 'express';
import { createAuthRoutes } from './authRoutes.js';
import { createAvailabilityRoutes } from './availabilityRoutes.js';
import { createAppointmentRoutes } from './appointmentRoutes.js';

export function createApiRouter() {
  const router = Router();

  router.use('/auth', createAuthRoutes());
  router.use('/availability', createAvailabilityRoutes());
  router.use('/appointments', createAppointmentRoutes());

  return router;
}
