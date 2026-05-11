import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { AppointmentController } from '../controllers/AppointmentController.js';

export function createAppointmentRoutes() {
  const router = Router();
  const controller = new AppointmentController();

  router.post('/', authMiddleware, controller.schedule);
  router.get('/', authMiddleware, controller.listMine);
  router.patch('/:id/reschedule', authMiddleware, controller.reschedule);
  router.patch('/:id/cancel', authMiddleware, controller.cancel);

  return router;
}
