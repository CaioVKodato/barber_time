import { Router } from 'express';
import { AvailabilityController } from '../controllers/AvailabilityController.js';

export function createAvailabilityRoutes() {
  const router = Router();
  const controller = new AvailabilityController();

  router.get('/available-slots', controller.listAvailable);

  return router;
}
