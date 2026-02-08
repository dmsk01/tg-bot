import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller.js';
import {
  validateTelegramInitData,
  authenticateUser,
} from '../middlewares/validate-telegram.middleware.js';

const router = Router();

router.use(validateTelegramInitData);
router.use(authenticateUser);

router.get('/', (req, res) => transactionController.getHistory(req, res));

export default router;
