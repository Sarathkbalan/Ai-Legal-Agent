const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

class AuditService {
  /**
   * Records an audit event in MongoDB.
   */
  static async logEvent(eventType, severity, details, req = null) {
    try {
      const ipAddress = req?.ip || req?.connection?.remoteAddress || '127.0.0.1';
      const userAgent = req?.headers ? req.headers['user-agent'] : 'System';

      const entry = await AuditLog.create({
        eventType,
        severity,
        details,
        ipAddress,
        userAgent
      });

      logger.info(`[AUDIT] ${eventType} [${severity}]`, { id: entry._id });
      return entry;
    } catch (err) {
      logger.error('Failed to write audit log entry:', { error: err.message });
      return null;
    }
  }

  static async logRejection(reason, details, req = null) {
    return this.logEvent('DOCUMENT_REJECTED', 'WARNING', { reason, ...details }, req);
  }

  static async logSecurityAlert(details, req = null) {
    return this.logEvent('PROMPT_GUARD_TRIGGERED', 'SECURITY_ALERT', details, req);
  }

  static async logIndexed(documentId, stats, req = null) {
    return this.logEvent('DOCUMENT_INDEXED', 'INFO', { documentId, ...stats }, req);
  }
}

module.exports = AuditService;
