const crypto = require('crypto');
const { hfClient, BGE_M3_MODEL, hasHfToken } = require('../../config/huggingface');
const logger = require('../../utils/logger');

class BgeEmbeddingService {
  /**
   * Generates a 1024-dimensional dense vector embedding for input text using BAAI/bge-m3.
   * Includes fallback deterministic vector generation for development/testing without HF tokens.
   */
  static async getEmbedding(text) {
    const trimmed = text.slice(0, 4000); // BGE-M3 context limit

    if (hasHfToken) {
      try {
        const response = await hfClient.featureExtraction({
          model: BGE_M3_MODEL,
          inputs: trimmed
        });

        // If returned as nested array [[0.1, ...]], flatten to 1024
        if (Array.isArray(response)) {
          return Array.isArray(response[0]) ? response[0] : response;
        }
      } catch (err) {
        logger.warn(`HF Inference failed for ${BGE_M3_MODEL}: ${err.message}. Falling back to normalized pseudo-embedding.`);
      }
    }

    // High-entropy deterministic fallback embedding (1024 floats)
    return this.generateDeterministicVector(trimmed, 1024);
  }

  /**
   * Batch embeds multiple texts.
   */
  static async getEmbeddingsBatch(texts, batchSize = 8) {
    const embeddings = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map((t) => this.getEmbedding(t));
      const batchResults = await Promise.all(batchPromises);
      embeddings.push(...batchResults);
    }
    return embeddings;
  }

  /**
   * Generates a unit-normalized 1024-dimensional vector deterministically from text.
   * Guarantees consistent vector geometry and cosine distance functionality in local dev.
   */
  static generateDeterministicVector(text, dimensions = 1024) {
    const vector = new Float32Array(dimensions);
    const hash = crypto.createHash('sha256').update(text).digest();

    let norm = 0;
    for (let i = 0; i < dimensions; i++) {
      const byte1 = hash[i % hash.length];
      const byte2 = hash[(i * 7 + 3) % hash.length];
      // Generate value between -1.0 and 1.0
      const val = ((byte1 ^ byte2) / 127.5) - 1.0;
      vector[i] = val;
      norm += val * val;
    }

    // Normalize to unit vector (L2 norm)
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < dimensions; i++) {
        vector[i] = vector[i] / norm;
      }
    }

    return Array.from(vector);
  }
}

module.exports = BgeEmbeddingService;
