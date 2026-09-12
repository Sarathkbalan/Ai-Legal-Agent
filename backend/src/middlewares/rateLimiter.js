const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
  windowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many document uploads requested from this IP address. Please try again later.'
    }
  }
});

const chatLimiter = rateLimit({
  windowMs: parseInt(process.env.CHAT_RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.CHAT_RATE_LIMIT_MAX || '60', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many legal research queries from this IP. Please wait a moment before sending more queries.'
    }
  }
});

module.exports = {
  uploadLimiter,
  chatLimiter
};
