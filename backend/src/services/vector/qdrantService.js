const { qdrantClient, COLLECTION_NAME, initQdrantCollection } = require('../../config/qdrant');
const logger = require('../../utils/logger');

class QdrantService {
  /**
   * Initializes collection if needed.
   */
  static async init() {
    return initQdrantCollection();
  }

  /**
   * Upserts legal chunks and enriched metadata payload into Qdrant.
   */
  static async upsertChunks(chunks, embeddings, documentId, legalMetadata) {
    if (!chunks.length || chunks.length !== embeddings.length) {
      throw new Error('Chunks and embeddings count mismatch');
    }

    const points = chunks.map((chunk, index) => {
      return {
        id: chunk.qdrantPointId,
        vector: embeddings[index],
        payload: {
          document_id: documentId.toString(),
          chunk_id: chunk._id ? chunk._id.toString() : chunk.qdrantPointId,
          chunk_index: chunk.chunkIndex,
          text: chunk.content,
          legal_metadata: {
            case_title: legalMetadata.title,
            neutral_citation: legalMetadata.neutralCitation,
            alternative_citations: legalMetadata.alternativeCitations || [],
            court: legalMetadata.court,
            court_tier: legalMetadata.courtTier || 4,
            jurisdiction: legalMetadata.jurisdiction,
            year: legalMetadata.year,
            date: legalMetadata.judgmentDate,
            judges: legalMetadata.judges || [],
            legal_domains: legalMetadata.legalDomains || [],
            parties: legalMetadata.parties || {}
          },
          pinpoint: {
            section_title: chunk.sectionTitle,
            paragraph_numbers: chunk.paragraphNumbers || [],
            statute_sections: chunk.statuteSections || []
          },
          text_length: chunk.content.length,
          token_count: chunk.tokenCount
        }
      };
    });

    // Batch upsert in groups of 32
    const BATCH_SIZE = 32;
    for (let i = 0; i < points.length; i += BATCH_SIZE) {
      const slice = points.slice(i, i + BATCH_SIZE);
      await qdrantClient.upsert(COLLECTION_NAME, {
        wait: true,
        points: slice
      });
    }

    logger.info(`Successfully indexed ${points.length} chunks in Qdrant for document ${documentId}`);
    return true;
  }

  /**
   * Searches Qdrant for relevant legal chunks using cosine similarity and metadata filters.
   */
  static async search(vector, limit = 15, filters = {}) {
    const filterConditions = [];

    if (filters.jurisdiction) {
      filterConditions.push({
        key: 'legal_metadata.jurisdiction',
        match: { value: filters.jurisdiction }
      });
    }

    if (filters.court) {
      filterConditions.push({
        key: 'legal_metadata.court',
        match: { value: filters.court }
      });
    }

    if (filters.courtTier) {
      filterConditions.push({
        key: 'legal_metadata.court_tier',
        match: { value: Number(filters.courtTier) }
      });
    }

    if (filters.legalDomain) {
      filterConditions.push({
        key: 'legal_metadata.legal_domains',
        match: { value: filters.legalDomain }
      });
    }

    if (filters.yearRange?.start || filters.yearRange?.end) {
      const range = {};
      if (filters.yearRange.start) range.gte = Number(filters.yearRange.start);
      if (filters.yearRange.end) range.lte = Number(filters.yearRange.end);
      filterConditions.push({
        key: 'legal_metadata.year',
        range
      });
    }

    const qdrantFilter = filterConditions.length > 0
      ? { must: filterConditions }
      : undefined;

    const response = await qdrantClient.query(COLLECTION_NAME, {
      query: vector,
      limit,
      filter: qdrantFilter,
      with_payload: true,
      with_vector: false
    });

    const points = response.points || response || [];
    return points.map((hit) => ({
      id: hit.id,
      score: hit.score,
      payload: hit.payload
    }));
  }

  /**
   * Deletes all points belonging to a specific document ID.
   */
  static async deleteByDocumentId(documentId) {
    try {
      await qdrantClient.delete(COLLECTION_NAME, {
        wait: true,
        filter: {
          must: [
            {
              key: 'document_id',
              match: { value: documentId.toString() }
            }
          ]
        }
      });
      logger.info(`Deleted points for document ${documentId} from Qdrant`);
    } catch (err) {
      logger.error(`Error deleting points for document ${documentId}:`, { error: err.message });
      throw err;
    }
  }
}

module.exports = QdrantService;
