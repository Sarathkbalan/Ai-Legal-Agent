const { QdrantClient } = require('@qdrant/js-client-rest');
const logger = require('../utils/logger');

const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
const qdrantApiKey = process.env.QDRANT_API_KEY || undefined;
const COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || 'uk_legal_documents';

const qdrantClient = new QdrantClient({
  url: qdrantUrl,
  apiKey: qdrantApiKey
});

/**
 * Ensures the UK legal documents vector collection and required payload indexes exist.
 */
const initQdrantCollection = async () => {
  try {
    const { collections } = await qdrantClient.getCollections();
    const exists = collections.some((c) => c.name === COLLECTION_NAME);

    if (!exists) {
      logger.info(`Creating Qdrant collection: ${COLLECTION_NAME} (1024-dim, Cosine)`);
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 1024, // BAAI/bge-m3 dense vector dimensions
          distance: 'Cosine'
        },
        hnsw_config: {
          m: 16,
          ef_construct: 128,
          full_scan_threshold: 1000
        }
      });
      logger.info(`Collection ${COLLECTION_NAME} created successfully`);
    } else {
      logger.info(`Qdrant collection ${COLLECTION_NAME} already exists`);
    }

    // Create payload schema indexes for low-latency legal filtering
    const indexFields = [
      { field: 'document_id', type: 'keyword' },
      { field: 'legal_metadata.jurisdiction', type: 'keyword' },
      { field: 'legal_metadata.court', type: 'keyword' },
      { field: 'legal_metadata.court_tier', type: 'integer' },
      { field: 'legal_metadata.year', type: 'integer' },
      { field: 'legal_metadata.neutral_citation', type: 'keyword' },
      { field: 'legal_metadata.legal_domains', type: 'keyword' }
    ];

    for (const { field, type } of indexFields) {
      try {
        await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
          field_name: field,
          field_schema: type
        });
      } catch (idxErr) {
        // Payload index might already exist
        logger.debug(`Payload index for ${field}: ${idxErr.message}`);
      }
    }

    logger.info('Qdrant payload indexes initialized');
    return true;
  } catch (error) {
    logger.error('Error initializing Qdrant collection:', { error: error.message });
    throw error;
  }
};

module.exports = {
  qdrantClient,
  COLLECTION_NAME,
  initQdrantCollection
};
