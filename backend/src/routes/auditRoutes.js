const express = require('express');
const router = express.Router();
const AuditController = require('../controllers/auditController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

// GET /api/v1/audit/logs - Paginated compliance logs (Admin Only)
router.get('/logs', authenticate, requireRole(['admin']), AuditController.getAuditLogs);

// GET /api/v1/audit/stats - Dashboard analytics and rejection breakdown
router.get('/stats', AuditController.getStats);

module.exports = router;
