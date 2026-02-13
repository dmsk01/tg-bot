import { Router } from 'express';
import { adminUsersController } from '../controllers/admin-users.controller.js';
import { authenticateAdmin } from '../middlewares/admin-auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticateAdmin);

// User management
router.get('/', requirePermission('view_data'), (req, res) => adminUsersController.getUsers(req, res));
router.get('/:id', requirePermission('view_data'), (req, res) => adminUsersController.getUser(req, res));
router.patch('/:id', requirePermission('block_users'), (req, res) => adminUsersController.updateUser(req, res));
router.post('/:id/balance', requirePermission('change_balance'), (req, res) => adminUsersController.changeBalance(req, res));
router.get('/:id/transactions', requirePermission('view_data'), (req, res) => adminUsersController.getUserTransactions(req, res));
router.get('/:id/generations', requirePermission('view_data'), (req, res) => adminUsersController.getUserGenerations(req, res));
router.get('/:id/logs', requirePermission('view_data'), (req, res) => adminUsersController.getUserLogs(req, res));
router.get('/:id/generations/export', requirePermission('view_data'), (req, res) => adminUsersController.exportUserGenerations(req, res));
router.get('/:id/transactions/export', requirePermission('view_data'), (req, res) => adminUsersController.exportUserTransactions(req, res));
router.get('/:id/logs/export', requirePermission('view_data'), (req, res) => adminUsersController.exportUserLogs(req, res));
router.delete('/:id', requirePermission('block_users'), (req, res) => adminUsersController.deleteUser(req, res));

export default router;
