import { Router } from 'express';
import { adminStatsController } from '../controllers/admin-stats.controller.js';
import { authenticateAdmin } from '../middlewares/admin-auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticateAdmin);
router.use(requirePermission('view_data'));

router.get('/dashboard', (req, res) => adminStatsController.getDashboard(req, res));
router.get('/users', (req, res) => adminStatsController.getUsersStats(req, res));
router.get('/generations', (req, res) => adminStatsController.getGenerationsStats(req, res));
router.get('/revenue', (req, res) => adminStatsController.getRevenueStats(req, res));
router.get('/api-usage', (req, res) => adminStatsController.getApiUsageStats(req, res));

export default router;
