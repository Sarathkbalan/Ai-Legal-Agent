const { UK_NEUTRAL_CITATION_PATTERNS, UK_STATUTE_PATTERNS } = require('../../utils/legalRegex');
const { JURISDICTIONS } = require('../../config/constants');
class QueryPlanner {
  /**
   * Evaluates whether the prompt contains any recognized legal topic, statute, citation, doctrine, or terminology.
   */
  static hasLegalTopic(prompt) {
    if (!prompt || typeof prompt !== 'string') return false;
    const trimmed = prompt.trim();
    if (trimmed.length < 3) return false;

    // 1. Check for Neutral Citations
    for (const pattern of UK_NEUTRAL_CITATION_PATTERNS) {
      if (pattern.test(trimmed)) return true;
    }

    // 2. Check for UK Statutes or Statutory Instruments
    for (const statPattern of UK_STATUTE_PATTERNS) {
      statPattern.lastIndex = 0; // reset stateful regex
      if (statPattern.test(trimmed)) return true;
    }

    // 3. Check for Statutory Sections / Provisions (e.g. s. 230, section 172, s 1(1))
    if (/\b(?:section|s\.)\s*\d+[A-Za-z]?(?:\(\d+\))?/i.test(trimmed)) {
      return true;
    }

    // 4. Check for Landmark Case Names & UK Authorities
    const landmarkRegex = /\b(uber|aslam|cavendish|makdessi|barclays|robinson|jogee|miller|cherry|lachaux|sequana|unwired|planet|huawei|regency|villas|donoghue|stevenson|caparo|dickman|hadley|baxendale|pinnock|parkingeye|beavis|prest|petrodel|wednesbury|bolam|bolitho|carlill|carbolic|salomon|anismic|padfield|entick|derry|hedley|byrne)\b/i;
    if (landmarkRegex.test(trimmed)) {
      return true;
    }

    // 5. Comprehensive Legal Concepts, Terminology & Topics
    const legalKeywordsRegex = /\b(law|legal|statute|statutes|statutory|court|courts|judge|judges|justice|judicial|judiciary|precedent|precedents|jurisdiction|jurisdictions|appellate|appeal|appeals|tribunal|tribunals|claimant|claimants|plaintiff|defendant|defendants|appellant|respondent|barrister|solicitor|litigation|litigate|lawsuit|liability|liable|non-liability|tort|torts|tortfeasor|negligence|negligent|duty of care|breach|breaches|damages|remedy|remedies|injunction|injunctions|contract|contracts|contractual|penalty|penalties|clause|clauses|repudiatory|frand|patent|patents|infringement|trademark|copyright|intellectual property|criminal|crime|mens rea|actus reus|secondary liability|joint enterprise|murder|manslaughter|theft|fraud|defamation|defamatory|libel|slander|serious harm|easement|easements|servitude|covenant|covenants|property|landlord|tenant|lease|freehold|employment|worker|workers|employee|employees|employer|employers|dismissal|unfair dismissal|vicarious liability|corporate|corporation|company|companies|director|directors|shareholder|shareholders|fiduciary|creditor|creditors|insolvency|insolvent|liquidation|winding up|prorogation|prorogue|prorogued|constitutional|ultra vires|judicial review|prerogative|parliament|parliamentary|legislation|act of parliament|common law|equity|equitable|trust|trusts|trustee|trustees|bailment|restitution|unjust enrichment|substantive law|procedural law|conviction|acquittal|stare decisis|ratio decidendi|obiter dicta|binding|persuasive|stipulation|severance|arbitration|adjudication|dispute|ruling|rulings|judgment|judgments|holding|subpoena|indemnity|estoppel|promissory estoppel|novus actus|contributory negligence|res ipsa loquitur|habeas corpus|locus standi|interim relief|settlement|privy council|supreme court|high court|court of appeal|crown court|magistrates|divorce|matrimonial|custody|bail|sentence|sentencing)\b/i;
    if (legalKeywordsRegex.test(trimmed)) {
      return true;
    }

    return false;
  }

  /**
   * Deconstructs and enriches a legal inquiry into a structured retrieval plan.
   */
  static plan(prompt, userFilters = {}) {
    const hasLegal = QueryPlanner.hasLegalTopic(prompt);

    // 1. Extract Target Neutral Citations
    let targetCitation = null;
    for (const pattern of UK_NEUTRAL_CITATION_PATTERNS) {
      const match = prompt.match(pattern);
      if (match) {
        targetCitation = match[0].trim();
        break;
      }
    }

    // 2. Extract Statutes
    const targetStatutes = [];
    for (const statPattern of UK_STATUTE_PATTERNS) {
      statPattern.lastIndex = 0;
      let m;
      while ((m = statPattern.exec(prompt)) !== null) {
        if (!targetStatutes.includes(m[0].trim())) {
          targetStatutes.push(m[0].trim());
        }
      }
    }

    // 3. Detect Substantive Legal Concepts & Query Expansion
    const expansions = [];
    const lower = prompt.toLowerCase();

    if (lower.includes('vicarious liability')) {
      expansions.push('course of employment', 'close connection test', 'akin to employment', 'independent contractor');
    }
    if (lower.includes('duty of care') || lower.includes('negligence')) {
      expansions.push('Caparo Industries', 'Robinson v Chief Constable', 'proximity', 'foreseeability', 'fair just and reasonable');
    }
    if (lower.includes('breach of contract')) {
      expansions.push('condition warranty innominate term', 'repudiatory breach', 'Hadley v Baxendale remoteness', 'expectation loss');
    }
    if (lower.includes('judicial review') || lower.includes('public authority')) {
      expansions.push('Wednesbury unreasonableness', 'ultra vires', 'procedural unfairness', 'legitimate expectation');
    }
    if (lower.includes('piercing the corporate veil')) {
      expansions.push('Prest v Petrodel', 'evasion principle', 'concealment principle');
    }

    // Combine original prompt with legal expansions
    const expandedQuery = expansions.length > 0
      ? `${prompt} (Key concepts: ${expansions.join(', ')})`
      : prompt;

    // 4. Determine Jurisdiction Bias
    let jurisdiction = userFilters.jurisdiction || null;
    if (!jurisdiction) {
      if (/scotland|scots|court of session|edinburgh/i.test(prompt)) {
        jurisdiction = JURISDICTIONS.SCOTLAND;
      } else if (/northern ireland|belfast/i.test(prompt)) {
        jurisdiction = JURISDICTIONS.NORTHERN_IRELAND;
      } else if (/england|wales|high court|court of appeal/i.test(prompt)) {
        jurisdiction = JURISDICTIONS.ENGLAND_WALES;
      }
    }

    return {
      originalPrompt: prompt,
      expandedQuery,
      targetCitation,
      targetStatutes,
      hasLegalTopic: hasLegal,
      filters: {
        ...userFilters,
        ...(jurisdiction ? { jurisdiction } : {})
      }
    };
  }
}

module.exports = QueryPlanner;
