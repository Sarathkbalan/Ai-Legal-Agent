const AuditLog = require('../models/AuditLog');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const ResearchSession = require('../models/ResearchSession');

class AuditController {
  /**
   * Retrieves paginated audit logs.
   */
  static async getAuditLogs(req, res, next) {
    try {
      const { page = 1, limit = 50, eventType, severity } = req.query;
      const filter = {};
      if (eventType) filter.eventType = eventType;
      if (severity) filter.severity = severity;

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit, 10)),
        AuditLog.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        data: logs,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / parseInt(limit, 10))
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieves overall system metrics for the dashboard.
   */
  static async getStats(req, res, next) {
    try {
      const [
        totalIndexed,
        totalRejected,
        totalChunks,
        totalSessions,
        securityBlocks
      ] = await Promise.all([
        Document.countDocuments({ status: 'indexed' }),
        AuditLog.countDocuments({ eventType: 'DOCUMENT_REJECTED' }),
        DocumentChunk.countDocuments(),
        ResearchSession.countDocuments(),
        AuditLog.countDocuments({ eventType: 'PROMPT_GUARD_TRIGGERED' })
      ]);

      // Rejection reasons breakdown
      const rejectionBreakdown = await AuditLog.aggregate([
        { $match: { eventType: 'DOCUMENT_REJECTED' } },
        { $group: { _id: '$details.reason', count: { $sum: 1 } } }
      ]);

      // Jurisdictional breakdown
      const jurisdictionBreakdown = await Document.aggregate([
        { $match: { status: 'indexed' } },
        { $group: { _id: '$legalMetadata.jurisdiction', count: { $sum: 1 } } }
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalIndexed,
          totalRejected,
          totalChunks,
          totalSessions,
          securityBlocks,
          rejectionBreakdown: rejectionBreakdown.reduce((acc, curr) => {
            if (curr._id) acc[curr._id] = curr.count;
            return acc;
          }, {}),
          jurisdictionBreakdown: jurisdictionBreakdown.reduce((acc, curr) => {
            if (curr._id) acc[curr._id] = curr.count;
            return acc;
          }, {})
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuditController;
