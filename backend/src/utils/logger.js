const formatLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

const logger = {
  info: (msg, meta) => console.log(formatLog('info', msg, meta)),
  warn: (msg, meta) => console.warn(formatLog('warn', msg, meta)),
  error: (msg, meta) => console.error(formatLog('error', msg, meta)),
  debug: (msg, meta) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(formatLog('debug', msg, meta));
    }
  }
};

module.exports = logger;
