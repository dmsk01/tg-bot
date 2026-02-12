import { Router } from 'express';
import { generationController } from '../controllers/generation.controller.js';
import {
  validateTelegramInitData,
  authenticateUser,
} from '../middlewares/validate-telegram.middleware.js';
import { generationRateLimiter } from '../middlewares/generation-rate-limit.middleware.js';

const router = Router();

router.use(validateTelegramInitData);
router.use(authenticateUser);

router.post('/create', generationRateLimiter, (req, res) =>
  generationController.create(req, res)
);
router.get('/history', (req, res) => generationController.getHistory(req, res));
router.get('/:id', (req, res) => generationController.getStatus(req, res));
router.delete('/:id', (req, res) => generationController.delete(req, res));

export default router;
