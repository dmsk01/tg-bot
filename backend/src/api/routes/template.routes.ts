import { Router } from 'express';
import { templateController } from '../controllers/template.controller.js';
import {
  validateTelegramInitData,
  authenticateUser,
} from '../middlewares/validate-telegram.middleware.js';

const router = Router();

router.use(validateTelegramInitData);
router.use(authenticateUser);

router.get('/', (req, res) => templateController.getAll(req, res));
router.get('/categories', (req, res) => templateController.getCategories(req, res));
router.get('/popular', (req, res) => templateController.getPopular(req, res));
router.get('/:id', (req, res) => templateController.getById(req, res));

export default router;
