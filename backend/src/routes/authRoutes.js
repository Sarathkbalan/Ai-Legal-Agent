const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

// POST /api/v1/auth/register - Multiple user registration
router.post('/register', AuthController.register);

// POST /api/v1/auth/login - User login
router.post('/login', AuthController.login);

// POST /api/v1/auth/switch-role - Persona / role switcher for testing
router.post('/switch-role', AuthController.switchRole);

// GET /api/v1/auth/me - Current user profile
router.get('/me', authenticate, AuthController.getMe);

module.exports = router;
