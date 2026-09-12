const { HfInference } = require('@huggingface/inference');
const logger = require('../utils/logger');

const hfToken = process.env.HF_API_TOKEN || '';
const bgeModel = process.env.BGE_M3_MODEL || 'BAAI/bge-m3';
const promptGuardModel = process.env.PROMPT_GUARD_MODEL || 'meta-llama/llama-prompt-guard-2-86m';

let hfClient = null;

if (hfToken && hfToken.trim().length > 0) {
  hfClient = new HfInference(hfToken);
  logger.info(`Hugging Face Inference client initialized with models: ${bgeModel} and ${promptGuardModel}`);
} else {
  // Can still be instantiated without token for public endpoints with rate limits
  hfClient = new HfInference();
  logger.info('Hugging Face client initialized without dedicated token.');
}

module.exports = {
  hfClient,
  BGE_M3_MODEL: bgeModel,
  PROMPT_GUARD_MODEL: promptGuardModel,
  hasHfToken: Boolean(hfToken && hfToken.trim().length > 0)
};
