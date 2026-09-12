class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR', details = null, stage = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;
    this.details = details;
    this.stage = stage;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
