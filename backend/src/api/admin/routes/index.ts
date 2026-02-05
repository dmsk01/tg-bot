import { Router } from 'express';
import { adminRateLimiter } from '../middlewares/rate-limit.middleware.js';
import adminAuthRoutes from './admin-auth.routes.js';
import adminUsersRoutes from './admin-users.routes.js';
import adminAdminsRoutes from './admin-admins.routes.js';
import promocodeRoutes from './promocode.routes.js';
import adminStatsRoutes from './admin-stats.routes.js';
import adminLogsRoutes from './admin-logs.routes.js';

const router = Router();

// Apply rate limiting to all admin routes
router.use(adminRateLimiter);

// Mount routes
router.use('/auth', adminAuthRoutes);
router.use('/users', adminUsersRoutes);
router.use('/admins', adminAdminsRoutes);
router.use('/promocodes', promocodeRoutes);
router.use('/stats', adminStatsRoutes);
router.use('/logs', adminLogsRoutes);

export default router;
