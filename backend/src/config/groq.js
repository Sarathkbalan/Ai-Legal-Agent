const Groq = require('groq-sdk');
const logger = require('../utils/logger');

const apiKey = process.env.GROQ_API_KEY || '';
const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

let groqClient = null;

if (apiKey && apiKey.trim().length > 0) {
  groqClient = new Groq({ apiKey });
  logger.info(`Groq client initialized with model: ${model}`);
} else {
  logger.warn('GROQ_API_KEY is not set. Groq client running in standby/mock mode.');
}

module.exports = {
  groqClient,
  GROQ_MODEL: model,
  hasGroqKey: Boolean(apiKey && apiKey.trim().length > 0)
};
