const express = require('express');
const mongoose = require('mongoose');
const { qdrantClient } = require('../config/qdrant');
const { hasGroqKey, GROQ_MODEL } = require('../config/groq');
const { hasHfToken, BGE_M3_MODEL, PROMPT_GUARD_MODEL } = require('../config/huggingface');

const router = express.Router();

router.get('/', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'disconnected',
      qdrant: 'disconnected',
      groq: hasGroqKey ? `active (${GROQ_MODEL})` : `standby / local engine (${GROQ_MODEL})`,
      embeddings: hasHfToken ? `hf-inference (${BGE_M3_MODEL})` : `local unit-normalized engine (${BGE_M3_MODEL})`,
      promptGuard: hasHfToken ? `hf-inference (${PROMPT_GUARD_MODEL})` : `heuristic defense engine (${PROMPT_GUARD_MODEL})`
    }
  };

  try {
    if (mongoose.connection.readyState === 1) {
      health.services.mongodb = 'connected';
    }
  } catch (e) {
    health.services.mongodb = `error: ${e.message}`;
  }

  try {
    const collections = await qdrantClient.getCollections();
    if (collections) {
      health.services.qdrant = 'connected';
    }
  } catch (e) {
    health.services.qdrant = `error: ${e.message}`;
  }

  const isHealthy = health.services.mongodb === 'connected' && health.services.qdrant === 'connected';
  res.status(isHealthy ? 200 : 503).json(health);
});

module.exports = router;
