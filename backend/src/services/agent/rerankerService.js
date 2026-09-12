const logger = require('../../utils/logger');

class RerankerService {
  /**
   * Reranks candidate chunks using precedent hierarchy boosting, exact citation matches, and lexical overlap.
   */
  static rerank(candidates, plan, topK = 7) {
    if (!candidates || candidates.length === 0) return [];

    const promptLower = plan.originalPrompt.toLowerCase();
    const promptWords = promptLower.split(/[^a-z0-9]+/).filter((w) => w.length > 2);

    const scored = candidates.map((candidate) => {
      const payload = candidate.payload;
      const meta = payload.legal_metadata || {};
      const caseTitleLower = (meta.case_title || '').toLowerCase();
      const chunkLower = (payload.text || '').toLowerCase();
      const neutralCitationLower = (meta.neutral_citation || '').toLowerCase();

      let compositeScore = candidate.score || 0.1;

      // 1. Exact Neutral Citation Boost (Highest Authority Signal)
      if (plan.targetCitation) {
        const targetCit = plan.targetCitation.toLowerCase();
        if (neutralCitationLower && (neutralCitationLower === targetCit || neutralCitationLower.includes(targetCit))) {
          compositeScore += 2.50;
        } else if (chunkLower.includes(targetCit)) {
          compositeScore += 1.50;
        }
      }

      // 2. Case Name / Party Name Overlap Boost
      const landmarkNames = [
        'uber', 'aslam', 'barclays', 'robinson', 'cavendish', 'makdessi',
        'jogee', 'miller', 'cherry', 'lachaux', 'sequana', 'unwired',
        'huawei', 'regency', 'diamond', 'donoghue', 'pinnock', 'parkingeye'
      ];
      for (const name of landmarkNames) {
        if (promptLower.includes(name)) {
          if (caseTitleLower.includes(name) || neutralCitationLower.includes(name)) {
            compositeScore += 1.80;
          } else if (chunkLower.includes(name)) {
            compositeScore += 0.80;
          }
        }
      }

      // 3. Statute Match Boost
      if (plan.targetStatutes && plan.targetStatutes.length > 0) {
        for (const statute of plan.targetStatutes) {
          const statLower = statute.toLowerCase();
          if (chunkLower.includes(statLower) || caseTitleLower.includes(statLower)) {
            compositeScore += 1.00;
            break;
          }
        }
      }

      // 4. Judicial Precedence Boost (Stare Decisis)
      const tier = meta.court_tier || 4;
      if (tier === 1) compositeScore += 0.20;      // Supreme Court / Parliament
      else if (tier === 2) compositeScore += 0.12; // Court of Appeal / Inner House
      else if (tier === 3) compositeScore += 0.06; // High Court / Outer House

      // 5. Lexical Overlap Score
      let matchCount = 0;
      for (const word of promptWords) {
        if (chunkLower.includes(word)) matchCount++;
      }
      const lexicalScore = (matchCount / Math.max(promptWords.length, 1)) * 0.35;
      compositeScore += lexicalScore;

      return {
        ...candidate,
        rerankScore: parseFloat(compositeScore.toFixed(4))
      };
    });

    // Sort descending by rerankScore
    scored.sort((a, b) => b.rerankScore - a.rerankScore);

    return scored.slice(0, topK);
  }

  /**
   * Evaluates if any of the reranked chunks actually pertain to the inquiry topic.
   */
  static hasCorpusRelevance(rerankedCandidates, plan) {
    if (!rerankedCandidates || rerankedCandidates.length === 0) return false;

    const topChunk = rerankedCandidates[0];
    const promptLower = plan.originalPrompt.toLowerCase();

    // Check citation match
    if (plan.targetCitation) {
      const cit = plan.targetCitation.toLowerCase();
      const metaCit = (topChunk.payload?.legal_metadata?.neutral_citation || '').toLowerCase();
      const chunkText = (topChunk.payload?.text || '').toLowerCase();
      if (metaCit.includes(cit) || chunkText.includes(cit)) return true;
    }

    // Check statute match
    if (plan.targetStatutes && plan.targetStatutes.length > 0) {
      const chunkText = (topChunk.payload?.text || '').toLowerCase();
      for (const stat of plan.targetStatutes) {
        if (chunkText.includes(stat.toLowerCase())) return true;
      }
    }

    // Check landmark name match
    const landmarkNames = [
      'uber', 'aslam', 'barclays', 'robinson', 'cavendish', 'makdessi',
      'jogee', 'miller', 'cherry', 'lachaux', 'sequana', 'unwired',
      'huawei', 'regency', 'diamond', 'donoghue', 'pinnock', 'parkingeye'
    ];
    for (const name of landmarkNames) {
      if (promptLower.includes(name)) {
        const chunkText = (topChunk.payload?.text || '').toLowerCase();
        const caseTitle = (topChunk.payload?.legal_metadata?.case_title || '').toLowerCase();
        if (caseTitle.includes(name) || chunkText.includes(name)) return true;
      }
    }

    // Check meaningful word matches (excluding stop words)
    const stopWords = new Set([
      'what', 'when', 'where', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
      'the', 'and', 'but', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
      'during', 'before', 'after', 'above', 'below', 'from', 'down', 'under', 'again',
      'further', 'then', 'once', 'here', 'there', 'all', 'any', 'both', 'each', 'few',
      'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
      'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'does', 'explain',
      'summarize', 'state', 'tell', 'discuss', 'analyze', 'give', 'under', 'are', 'was', 'were'
    ]);
    const promptWords = promptLower.split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !stopWords.has(w));

    // Check across top 3 chunks
    for (const chunk of rerankedCandidates.slice(0, 3)) {
      const text = (chunk.payload?.text || '').toLowerCase();
      const title = (chunk.payload?.legal_metadata?.case_title || '').toLowerCase();
      let matches = 0;
      for (const word of promptWords) {
        if (text.includes(word) || title.includes(word)) {
          matches++;
        }
      }
      if (matches >= 2 || (promptWords.length === 1 && matches === 1)) {
        return true;
      }
    }

    return false;
  }
}

module.exports = RerankerService;
