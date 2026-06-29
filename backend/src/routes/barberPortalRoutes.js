import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import { BarberAppointmentController } from '../controllers/BarberAppointmentController.js';

export function createBarberPortalRoutes() {
  const router = Router();
  const controller = new BarberAppointmentController();

  router.get('/appointments', authMiddleware, requireRole('barber'), controller.list);
  router.patch('/appointments/:id/confirm', authMiddleware, requireRole('barber'), controller.confirm);
  router.patch('/appointments/:id/reject', authMiddleware, requireRole('barber'), controller.reject);

  return router;
}
