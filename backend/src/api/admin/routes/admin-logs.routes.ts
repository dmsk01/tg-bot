import { Router } from 'express';
import { adminLogsController } from '../controllers/admin-logs.controller.js';
import { authenticateAdmin } from '../middlewares/admin-auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticateAdmin);
router.use(requirePermission('view_logs'));

router.get('/', (req, res) => adminLogsController.getLogs(req, res));
router.get('/:id', (req, res) => adminLogsController.getLog(req, res));

export default router;
