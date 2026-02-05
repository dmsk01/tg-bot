import { Router } from 'express';
import { userPromocodeController } from '../controllers/promocode.controller.js';
import { validateTelegramInitData, authenticateUser } from '../middlewares/validate-telegram.middleware.js';

const router = Router();

router.use(validateTelegramInitData);
router.use(authenticateUser);

router.post('/apply', (req, res) => userPromocodeController.apply(req, res));
router.post('/validate', (req, res) => userPromocodeController.validate(req, res));
router.get('/', (req, res) => userPromocodeController.getMyPromocodes(req, res));

export default router;
