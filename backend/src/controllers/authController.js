const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { JWT_SECRET } = require('../middlewares/authMiddleware');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

class AuthController {
  /**
   * Register a new user (supports multiple user registrations)
   */
  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        throw new AppError('Name, email, and password are required', 400, 'MISSING_FIELDS');
      }

      if (password.length < 6) {
        throw new AppError('Password must be at least 6 characters long', 400, 'WEAK_PASSWORD');
      }

      const cleanEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        throw new AppError('An account with this email address already exists. Please sign in.', 409, 'USER_EXISTS');
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // All self-registered users receive the 'user' role
      const newUser = await User.create({
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: 'user'
      });

      const token = jwt.sign(
        {
          id: newUser._id,
          email: newUser.email,
          role: newUser.role,
          name: newUser.name
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      logger.info(`New user registered: ${newUser.email} (${newUser.name}) [Role: user]`);

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: newUser._id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * User login endpoint
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new AppError('Email and password are required', 400, 'MISSING_CREDENTIALS');
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      logger.info(`User authenticated successfully: ${user.email} [Role: ${user.role}]`);

      res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Quick persona / role switch endpoint for seamless testing
   */
  static async switchRole(req, res, next) {
    try {
      const { role } = req.body;
      if (!role || !['admin', 'user'].includes(role)) {
        throw new AppError('Valid role (admin or user) is required', 400, 'INVALID_ROLE');
      }

      const targetEmail = role === 'admin' ? 'admin123@gmail.com' : 'user@lawintel.uk';
      let user = await User.findOne({ email: targetEmail });

      if (!user) {
        await User.seedDefaultUsers();
        user = await User.findOne({ email: targetEmail });
      }

      const token = jwt.sign(
        {
          id: user ? user._id : `${role}-id`,
          email: user ? user.email : targetEmail,
          role: role,
          name: user ? user.name : (role === 'admin' ? 'Legal Ops Administrator' : 'Associate Legal Researcher')
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      logger.info(`Role switched to: ${role} (${targetEmail})`);

      res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            id: user ? user._id : `${role}-id`,
            email: user ? user.email : targetEmail,
            name: user ? user.name : (role === 'admin' ? 'Legal Ops Administrator' : 'Associate Legal Researcher'),
            role: role
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get current authenticated user profile
   */
  static async getMe(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
