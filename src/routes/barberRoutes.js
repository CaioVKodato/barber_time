import { Router } from 'express';
import { BarberController } from '../controllers/BarberController.js';

export function createBarberRoutes() {
  const router = Router();
  const controller = new BarberController();

  router.get('/', controller.list);
  router.post('/register', controller.register);

  return router;
}
