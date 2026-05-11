import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';

export function createAuthRoutes() {
  const router = Router();
  const controller = new AuthController();

  router.post('/register', controller.register);
  router.post('/login', controller.login);

  return router;
}
