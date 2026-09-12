const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: [
      'DOCUMENT_UPLOAD_ATTEMPT',
      'DOCUMENT_VALIDATION_SUCCESS',
      'DOCUMENT_REJECTED',
      'DOCUMENT_INDEXED',
      'PROMPT_GUARD_TRIGGERED',
      'RESEARCH_QUERY_EXECUTED',
      'CITATION_HALLUCINATION_DETECTED',
      'DOCUMENT_DELETED'
    ],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'SECURITY_ALERT', 'CRITICAL'],
    default: 'INFO',
    index: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: { type: String, default: '127.0.0.1' },
  userAgent: { type: String, default: 'Internal/Direct' }
}, {
  timestamps: true
});

AuditLogSchema.index({ eventType: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
