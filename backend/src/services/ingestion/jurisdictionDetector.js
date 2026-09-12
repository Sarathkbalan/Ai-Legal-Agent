const AppError = require('../../utils/appError');
const { REJECTION_CODES, JURISDICTIONS } = require('../../config/constants');
const {
  UK_NEUTRAL_CITATION_PATTERNS,
  UK_LAW_REPORT_PATTERNS,
  UK_COURT_HEADERS,
  UK_ENACTMENT_REGEX,
  FOREIGN_JURISDICTION_PATTERNS
} = require('../../utils/legalRegex');
const logger = require('../../utils/logger');

class JurisdictionDetector {
  /**
   * Informative pre-screening for foreign jurisdiction markers.
   * Logs foreign authorities if detected without throwing fatal rejection errors.
   */
  static checkForeignJurisdiction(text, filename = '') {
    const headerSnippet = text.slice(0, 4000);
    const matches = [];
    for (const { name, regex } of FOREIGN_JURISDICTION_PATTERNS) {
      if (regex.test(headerSnippet)) {
        logger.info(`Foreign jurisdiction indicator noted: ${name} in ${filename}`);
        matches.push(name);
      }
    }
    return {
      hasForeignMarkers: matches.length > 0,
      detectedForeignSignifiers: matches
    };
  }

  /**
   * Evaluates and verifies UK legal jurisdiction.
   * Smoothly identifies UK jurisdiction without rejecting valid legal materials.
   */
  static detect(text, filename = '') {
    const foreignInfo = this.checkForeignJurisdiction(text, filename);
    const headerSnippet = text.slice(0, 4000);
    const fullSnippet = text.slice(0, 25000);

    // Positive UK Jurisdiction Signatures
    let ukConfidence = 0;
    let detectedCitation = null;
    let detectedCourt = null;
    let detectedJurisdiction = JURISDICTIONS.UK_WIDE;

    // Check UK Neutral Citations
    for (const pattern of UK_NEUTRAL_CITATION_PATTERNS) {
      const match = headerSnippet.match(pattern) || fullSnippet.match(pattern);
      if (match) {
        detectedCitation = match[0];
        ukConfidence += 50;

        // Sub-jurisdiction attribution
        if (pattern.source.includes('CSIH') || pattern.source.includes('CSOH') || pattern.source.includes('HCJAC')) {
          detectedJurisdiction = JURISDICTIONS.SCOTLAND;
          detectedCourt = 'Court of Session';
        } else if (pattern.source.includes('NICA') || pattern.source.includes('NIKB') || pattern.source.includes('NIQB')) {
          detectedJurisdiction = JURISDICTIONS.NORTHERN_IRELAND;
          detectedCourt = 'Northern Ireland Courts';
        } else if (pattern.source.includes('UKSC')) {
          detectedJurisdiction = JURISDICTIONS.UK_WIDE;
          detectedCourt = 'UK Supreme Court';
        } else if (pattern.source.includes('UKPC')) {
          detectedJurisdiction = JURISDICTIONS.UK_WIDE;
          detectedCourt = 'Privy Council';
        } else if (pattern.source.includes('EWCA')) {
          detectedJurisdiction = JURISDICTIONS.ENGLAND_WALES;
          detectedCourt = match[1]?.toLowerCase() === 'crim' 
            ? 'Court of Appeal (Criminal Division)' 
            : 'Court of Appeal (Civil Division)';
        } else if (pattern.source.includes('EWHC')) {
          detectedJurisdiction = JURISDICTIONS.ENGLAND_WALES;
          detectedCourt = 'High Court of Justice';
        }
        break;
      }
    }

    // Check UK Court Headers
    for (const headerPattern of UK_COURT_HEADERS) {
      if (headerPattern.test(headerSnippet)) {
        ukConfidence += 30;
        if (!detectedCourt) {
          detectedCourt = 'UK Senior Courts';
        }
      }
    }

    // Check UK Enactment Formula (Parliament Acts)
    if (UK_ENACTMENT_REGEX.test(headerSnippet)) {
      ukConfidence += 50;
      detectedJurisdiction = JURISDICTIONS.UK_WIDE;
      detectedCourt = 'UK Parliament (Act of Parliament)';
    }

    // Check UK Law Reports
    for (const reportPattern of UK_LAW_REPORT_PATTERNS) {
      if (reportPattern.test(fullSnippet)) {
        ukConfidence += 15;
      }
    }

    // Broad UK Geographic, Regional & Institutional Indicators
    if (/\b(?:United\s+Kingdom|UK|U\.K\.|Great\s+Britain|Britain|British|English)\b/i.test(fullSnippet)) {
      ukConfidence += 25;
    }

    if (/\b(?:England\s+and\s+Wales|Royal\s+Courts\s+of\s+Justice|Strand,\s+London|London|English\s+law|laws?\s+of\s+England|Manchester|Birmingham|Leeds|Bristol|Liverpool|Sheffield|Newcastle|Oxford|Cambridge|Westminster|Whitehall|Thames)\b/i.test(fullSnippet)) {
      ukConfidence += 25;
      if (detectedJurisdiction === JURISDICTIONS.UK_WIDE && !detectedCitation?.includes('UKSC')) {
        detectedJurisdiction = JURISDICTIONS.ENGLAND_WALES;
      }
    }
    if (/\b(?:Court\s+of\s+Session|High\s+Court\s+of\s+Justiciary|Edinburgh|Glasgow|Scots\s+Law|Scotland|Scottish)\b/i.test(fullSnippet)) {
      ukConfidence += 25;
      detectedJurisdiction = JURISDICTIONS.SCOTLAND;
    }
    if (/\b(?:Northern\s+Ireland|Belfast|Royal\s+Courts\s+of\s+Justice,\s+Belfast)\b/i.test(fullSnippet)) {
      ukConfidence += 25;
      detectedJurisdiction = JURISDICTIONS.NORTHERN_IRELAND;
    }

    // UK Institutions, Governance & Crown
    if (/\b(?:Parliament|Crown|Monarchy|His\s+Majesty|Her\s+Majesty|King|Queen|HMRC|NHS|Home\s+Office|Ministry\s+of\s+Justice|Cabinet\s+Office|Privy\s+Council|House\s+of\s+Lords|House\s+of\s+Commons|Metropolitan\s+Police|Constabulary)\b/i.test(fullSnippet)) {
      ukConfidence += 25;
    }

    // UK Currency
    if (/[£]|(?:GBP|pounds?\s+sterling|pence)/.test(fullSnippet)) {
      ukConfidence += 20;
    }

    // UK Acts of Parliament / Statutory Regulations in text
    if (/\b[A-Z][a-zA-Z0-9,'-]+\s+(?:Act|Order|Regulations)\s+(?:18|19|20)\d\d\b/.test(fullSnippet)) {
      ukConfidence += 30;
      if (!detectedCourt) {
        detectedCourt = 'UK Parliament (Statute / Regulations)';
      }
    }

    // General UK legal terms check
    if (/\b(?:solicitor|barrister|chancery|inns\s+of\s+court|crown\s+court|magistrates|parliament|act\s+of\s+parliament)\b/i.test(fullSnippet)) {
      ukConfidence += 20;
    }

    // Governing Law UK clause
    if (/\bgoverning\s+law\b.*?\b(?:england|wales|scotland|northern\s+ireland|uk|united\s+kingdom)\b/i.test(fullSnippet) ||
        /\bjurisdiction\s+of\s+the\s+english\s+courts\b/i.test(fullSnippet)) {
      ukConfidence += 30;
      if (detectedJurisdiction === JURISDICTIONS.UK_WIDE) {
        detectedJurisdiction = JURISDICTIONS.ENGLAND_WALES;
      }
    }

    // Filename UK relevance check
    if (/(?:uk|united_kingdom|england|london|scotland|wales|parliament|police|court|act|agreement|law|british|crown)/i.test(filename)) {
      ukConfidence += 20;
    }

    // Explicit foreign jurisdiction rejection: only reject if document has zero UK context
    if (foreignInfo.hasForeignMarkers && ukConfidence === 0) {
      throw new AppError(
        `Document rejected: Detected non-UK jurisdiction (${foreignInfo.detectedForeignSignifiers.join(', ')}). The document has no connection to the United Kingdom. Please upload documents related to the UK.`,
        422,
        REJECTION_CODES.NON_UK_LEGAL_DOCUMENT,
        { detectedForeignSignifiers: foreignInfo.detectedForeignSignifiers },
        'UK_JURISDICTION_DETECTION'
      );
    }

    // UK Relevance Gate: Document must have connection to the UK
    if (ukConfidence === 0) {
      throw new AppError(
        'Document rejected: Not related to the UK. The uploaded document contains no references to the United Kingdom, England, Scotland, Wales, Northern Ireland, or UK legal matters. Please upload documents related to the UK.',
        422,
        REJECTION_CODES.NON_UK_LEGAL_DOCUMENT,
        {
          ukConfidenceScore: ukConfidence,
          citationFound: detectedCitation
        },
        'UK_JURISDICTION_DETECTION'
      );
    }

    logger.info(`UK relevance verified for ${filename}: ${detectedJurisdiction} (confidence: ${ukConfidence}%, court: ${detectedCourt || 'UK Authority'})`);

    return {
      isUk: true,
      jurisdiction: detectedJurisdiction,
      detectedCourt: detectedCourt || 'UK Legal Authority',
      detectedCitation,
      ukConfidence,
      foreignInfo,
      verificationStatus: 'Verified UK Authority'
    };
  }
}

module.exports = JurisdictionDetector;
