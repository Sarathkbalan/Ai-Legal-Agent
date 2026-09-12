const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditService = require('../services/auditService');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'lawintel-uk-legal-secret-key-2026';

/**
 * Middleware to authenticate user from JWT or fallback role header.
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role || 'user',
          name: decoded.name || 'Legal Researcher'
        };
        return next();
      } catch (err) {
        logger.warn(`JWT verification failed: ${err.message}. Checking fallback role header.`);
      }
    }

    // Fallback: Check x-user-role header (e.g. for rapid role switching/testing)
    const roleHeader = req.headers['x-user-role'];
    if (roleHeader && ['admin', 'user'].includes(roleHeader.toLowerCase())) {
      const role = roleHeader.toLowerCase();
      req.user = {
        id: role === 'admin' ? 'admin-system-id' : 'user-system-id',
        email: role === 'admin' ? 'admin123@gmail.com' : 'user@lawintel.uk',
        role: role,
        name: role === 'admin' ? 'System Administrator' : 'Associate Legal Researcher'
      };
      return next();
    }

    // Default to standard user if unauthenticated
    req.user = {
      id: 'anonymous-user-id',
      email: 'user@lawintel.uk',
      role: 'user',
      name: 'Associate Legal Researcher'
    };
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware to enforce role-based access control.
 * @param {string|string[]} allowedRoles
 */
const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const userRole = req.user?.role || 'unauthenticated';
      logger.warn(`Access denied on ${req.method} ${req.originalUrl} for role "${userRole}". Required: [${roles.join(', ')}]`);

      AuditService.logEvent(
        'ACCESS_DENIED_ROLE_RESTRICTION',
        'WARN',
        {
          path: req.originalUrl,
          method: req.method,
          userRole,
          requiredRoles: roles
        },
        req
      ).catch(() => {});

      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Access denied. ${roles.includes('admin') ? 'Administrator privileges are required to upload documents or manage RAG data.' : 'You do not have permission to perform this action.'}`,
          currentRole: userRole,
          requiredRoles: roles
        }
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  requireRole,
  JWT_SECRET
};
