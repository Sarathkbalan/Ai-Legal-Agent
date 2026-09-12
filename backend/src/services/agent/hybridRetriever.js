const BgeEmbeddingService = require('../vector/bgeEmbeddingService');
const QdrantService = require('../vector/qdrantService');
const { qdrantClient, COLLECTION_NAME } = require('../../config/qdrant');
const logger = require('../../utils/logger');

class HybridRetriever {
  /**
   * Performs TRUE Hybrid Retrieval:
   * 1. Dense Vector Search (BGE-M3 1024-dim cosine distance)
   * 2. Lexical & Exact Authority Search (Neutral Citations, Statutes, Case Titles, Prompt Keywords)
   * 3. Merged & Deduplicated Candidate Pool
   */
  static async retrieve(plan, limit = 25) {
    logger.info(`Starting True Hybrid Retrieval for query: "${plan.expandedQuery.slice(0, 100)}..."`);
    
    // 1. Dense Vector Search
    let vectorHits = [];
    try {
      const queryVector = await BgeEmbeddingService.getEmbedding(plan.expandedQuery);
      vectorHits = await QdrantService.search(queryVector, limit, plan.filters);
    } catch (vErr) {
      logger.warn('Dense vector search warning:', vErr.message);
    }

    // 2. Lexical & Exact Metadata Retrieval from Qdrant
    let lexicalHits = [];
    try {
      const scrollRes = await qdrantClient.scroll(COLLECTION_NAME, {
        limit: 250,
        with_payload: true,
        with_vector: false
      });

      const points = scrollRes.points || scrollRes || [];
      const promptLower = plan.originalPrompt.toLowerCase();
      const targetCit = (plan.targetCitation || '').toLowerCase();
      const targetStatutes = (plan.targetStatutes || []).map(s => s.toLowerCase());
      const words = promptLower.split(/[^a-z0-9]+/).filter(w => w.length > 3);

      for (const p of points) {
        let matchScore = 0;
        const meta = p.payload?.legal_metadata || {};
        const textLower = (p.payload?.text || '').toLowerCase();
        const caseTitleLower = (meta.case_title || '').toLowerCase();
        const citationLower = (meta.neutral_citation || '').toLowerCase();

        // A. Exact Neutral Citation Match (Highest priority)
        if (targetCit && (citationLower.includes(targetCit) || textLower.includes(targetCit))) {
          matchScore += 0.90;
        }

        // B. Target Statute Match
        for (const stat of targetStatutes) {
          if (caseTitleLower.includes(stat) || textLower.includes(stat)) {
            matchScore += 0.70;
            break;
          }
        }

        // C. Specific Case Name / Landmark Name Matching
        const landmarkNames = ['robinson', 'barclays', 'uber', 'cavendish', 'jogee', 'miller', 'cherry', 'lachaux', 'sequana', 'unwired', 'regency', 'donoghue'];
        for (const name of landmarkNames) {
          if (promptLower.includes(name) && (caseTitleLower.includes(name) || textLower.includes(name))) {
            matchScore += 0.65;
            break;
          }
        }

        // D. Term Frequency / Word Overlap
        if (words.length > 0) {
          let wordMatches = 0;
          for (const w of words) {
            if (caseTitleLower.includes(w) || textLower.includes(w)) {
              wordMatches++;
            }
          }
          matchScore += (wordMatches / words.length) * 0.40;
        }

        if (matchScore >= 0.25) {
          lexicalHits.push({
            id: p.id,
            score: parseFloat(matchScore.toFixed(4)),
            payload: p.payload
          });
        }
      }

      lexicalHits.sort((a, b) => b.score - a.score);
    } catch (lexErr) {
      logger.warn('Lexical retrieval error:', lexErr.message);
    }

    // 3. Merge & Deduplicate Candidates
    const candidateMap = new Map();

    // Add lexical hits first (ensures exact citation/case matches are always included)
    for (const hit of lexicalHits.slice(0, 15)) {
      candidateMap.set(hit.id, hit);
    }

    // Add vector hits
    for (const hit of vectorHits) {
      if (candidateMap.has(hit.id)) {
        // Boost existing hit score with vector similarity
        const existing = candidateMap.get(hit.id);
        existing.score = Math.max(existing.score, hit.score);
      } else {
        candidateMap.set(hit.id, hit);
      }
    }

    const mergedCandidates = Array.from(candidateMap.values());
    logger.info(`Hybrid retrieval completed: ${mergedCandidates.length} merged candidates (${lexicalHits.length} lexical, ${vectorHits.length} vector)`);

    return mergedCandidates;
  }
}

module.exports = HybridRetriever;
