const express = require('express');
const router = express.Router();
const ResearchController = require('../controllers/researchController');
const { chatLimiter } = require('../middlewares/rateLimiter');

// POST /api/v1/research/query - Full Legal Research Query Workflow
router.post('/query', chatLimiter, ResearchController.queryResearch);

// GET /api/v1/research/sessions - Research session histories
router.get('/sessions', ResearchController.getSessions);

// GET /api/v1/research/sessions/:sessionId - Specific session thread
router.get('/sessions/:sessionId', ResearchController.getSessionById);

module.exports = router;
