const crypto = require('crypto');
const Document = require('../../models/Document');
const SimHash = require('../../utils/simHash');
const AppError = require('../../utils/appError');
const { REJECTION_CODES } = require('../../config/constants');
const logger = require('../../utils/logger');

class DuplicateDetector {
  /**
   * Generates SHA-256 hash of buffer.
   */
  static generateFileHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generates 64-bit SimHash hex string from extracted text.
   */
  static generateSimHash(text) {
    return SimHash.calculate(text);
  }

  /**
   * Checks for exact file duplicates via SHA-256.
   * Returns existing document record if found, without throwing fatal rejection.
   */
  static async checkExactDuplicate(fileHash) {
    const existing = await Document.findOne({
      fileHash,
      status: { $ne: 'rejected' }
    }).select('_id filename originalName legalMetadata.title createdAt');

    if (existing) {
      logger.info(`Exact duplicate detected for fileHash ${fileHash}: matching existing document '${existing.originalName}' (${existing._id}). Will refresh/update.`);
      return existing;
    }
    return null;
  }

  /**
   * Checks for near-duplicate text (>92% SimHash similarity) against active indexed documents.
   * Returns near-duplicate metadata for tracking without rejecting the upload.
   */
  static async checkNearDuplicate(simHash, currentTitle = '') {
    if (!simHash || simHash === '0000000000000000') return null;

    try {
      const candidates = await Document.find({
        status: 'indexed',
        simHash: { $exists: true, $ne: '0000000000000000' }
      }).select('_id originalName legalMetadata.title simHash').limit(50);

      for (const doc of candidates) {
        const similarity = SimHash.similarity(simHash, doc.simHash);
        if (similarity >= 0.92) {
          logger.info(`Near-duplicate content noted (${(similarity * 100).toFixed(1)}% match with '${doc.legalMetadata?.title || doc.originalName}'). Gracefully continuing ingestion.`);
          return {
            isNearDuplicate: true,
            similarityScore: similarity,
            existingDocumentId: doc._id,
            existingTitle: doc.legalMetadata?.title || doc.originalName
          };
        }
      }
    } catch (err) {
      logger.warn('Error during near-duplicate check:', err.message);
    }
    return null;
  }
}

module.exports = DuplicateDetector;
