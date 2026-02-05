import { Router } from 'express';
import { adminAuthController } from '../controllers/admin-auth.controller.js';
import { authenticateAdmin } from '../middlewares/admin-auth.middleware.js';
import { authRateLimiter } from '../middlewares/rate-limit.middleware.js';

const router = Router();

router.post('/login', authRateLimiter, (req, res) => adminAuthController.login(req, res));
router.post('/logout', authenticateAdmin, (req, res) => adminAuthController.logout(req, res));
router.post('/refresh', (req, res) => adminAuthController.refresh(req, res));
router.get('/me', authenticateAdmin, (req, res) => adminAuthController.me(req, res));
router.patch('/password', authenticateAdmin, (req, res) => adminAuthController.changePassword(req, res));

export default router;
