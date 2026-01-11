import { Router } from 'express';
import { modelController } from '../controllers/model.controller.js';
import {
  validateTelegramInitData,
  authenticateUser,
} from '../middlewares/validate-telegram.middleware.js';

const router = Router();

router.use(validateTelegramInitData);
router.use(authenticateUser);

router.get('/', (req, res) => modelController.getAll(req, res));

export default router;
