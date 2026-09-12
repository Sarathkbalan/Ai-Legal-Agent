const logger = require('../utils/logger');
const AuditService = require('../services/auditService');

const errorHandler = async (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;
  const code = err.code || (statusCode === 422 ? 'VALIDATION_FAILED' : 'INTERNAL_SERVER_ERROR');

  logger.error(`Error [${statusCode}] ${err.message}`, {
    code,
    stage: err.stage,
    details: err.details,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // If this was an ingestion rejection, record it to audit trail
  if (statusCode === 422 && err.code) {
    await AuditService.logRejection(
      err.code,
      {
        message: err.message,
        stage: err.stage,
        details: err.details,
        originalName: req.file?.originalname || 'Unknown file'
      },
      req
    );
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message,
      stage: err.stage || null,
      details: err.details || null
    },
    meta: {
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    }
  });
};

module.exports = errorHandler;
