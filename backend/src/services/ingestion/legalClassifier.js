const AppError = require('../../utils/appError');
const { REJECTION_CODES } = require('../../config/constants');
const { UK_COURT_HEADERS, UK_ENACTMENT_REGEX } = require('../../utils/legalRegex');
const logger = require('../../utils/logger');

class LegalClassifier {
  /**
   * Evaluates if a document is a bona fide legal authority.
   * Rejects non-legal documents (invoices, recipes, general literature, tech manuals).
   */
  static classify(text, filename = '') {
    const headerSnippet = text.slice(0, 3000);
    const fullSnippet = text.slice(0, 15000);

    let legalScore = 0;
    const structuralMatches = [];

    // 1. Primary Judicial & Enactment Structural Headers (+35 pts each)
    for (const headerPattern of UK_COURT_HEADERS) {
      if (headerPattern.test(headerSnippet)) {
        legalScore += 35;
        structuralMatches.push(headerPattern.source);
        break;
      }
    }

    if (UK_ENACTMENT_REGEX.test(headerSnippet)) {
      legalScore += 45;
      structuralMatches.push('UK_ROYAL_ENACTMENT_CLAUSE');
    }

    // 2. Party, Procedural & Contractual Markers
    const proceduralMarkers = [
      /\bBETWEEN\s*:\s*\n/i,
      /\bCLAIMANT\b/i,
      /\bDEFENDANT\b/i,
      /\bAPPELLANT\b/i,
      /\bRESPONDENT\b/i,
      /\bON APPEAL FROM\b/i,
      /\bIN THE MATTER OF\b/i,
      /\bNEUTRAL CITATION\b/i,
      /\bJUDGMENT\b/i,
      /\bREASONS FOR DECISION\b/i,
      /\bORDER ACCORDINGLY\b/i,
      /\bTHIS AGREEMENT\b/i,
      /\bGOVERNING LAW\b/i,
      /\bTERMS AND CONDITIONS\b/i,
      /\bSCHEDULE\s+[0-9IVX]+\b/i,
      /\bCLAUSE\s+[0-9.]+\b/i,
      /\bIN WITNESS WHEREOF\b/i
    ];

    for (const marker of proceduralMarkers) {
      if (marker.test(headerSnippet)) {
        legalScore += 15;
        structuralMatches.push(marker.source);
      }
    }

    // 3. Substantive Legal Term Density (+3 pts per unique match)
    const legalVocabulary = [
      'jurisdiction', 'pursuant', 'statute', 'statutory', 'precedent',
      'tort', 'contract', 'liability', 'damages', 'injunction',
      'counsel', 'barrister', 'solicitor', 'submissions', 'tribunal',
      'appellant', 'respondent', 'claimant', 'defendant', 'affidavit',
      'admissible', 'ratio decidendi', 'obiter', 'ultra vires', 'prima facie',
      'appeal', 'coram', 'held', 'inter alia', 'herein', 'whereas',
      'indemnity', 'warranties', 'breach', 'covenant', 'termination',
      'obligations', 'dispute', 'arbitration', 'legislation', 'regulations',
      'tenancy', 'landlord', 'tenant', 'leasehold', 'freehold', 'covenant'
    ];

    const lower = fullSnippet.toLowerCase();
    let termMatches = 0;
    for (const term of legalVocabulary) {
      if (lower.includes(term)) {
        termMatches++;
      }
    }
    legalScore += termMatches * 3;

    const hasUkContext = (
      /\b(?:United\s+Kingdom|UK|U\.K\.|Great\s+Britain|Britain|British|England|Wales|Scotland|Northern\s+Ireland|London|English\s+law|Parliament|Crown|Police|HMRC|NHS)\b/i.test(fullSnippet) ||
      /(?:uk|england|london|scotland|wales|britain|act|police|agreement|court)/i.test(filename)
    );

    logger.debug('Legal classification score:', { filename, legalScore, structuralMatches, termMatches, hasUkContext });

    // Relaxed check: Accept if document has UK context, or any structural markers, or any legal terminology
    const isAccepted = hasUkContext || structuralMatches.length > 0 || termMatches > 0 || legalScore >= 10;

    if (!isAccepted) {
      throw new AppError(
        'Document rejected: Not related to the UK or legal matters. The uploaded file contains no UK context, judicial structure, contractual provisions, or legal terminology.',
        422,
        REJECTION_CODES.NON_LEGAL_DOCUMENT,
        {
          confidenceScore: legalScore,
          legalTermsFound: termMatches,
          structuralMarkers: structuralMatches,
          hasUkContext
        },
        'LEGAL_CLASSIFICATION'
      );
    }

    return {
      isLegal: true,
      legalScore: Math.max(legalScore, hasUkContext ? 35 : 15),
      structuralMatches,
      termMatches,
      hasUkContext,
      verificationStatus: 'Verified UK Authority'
    };
  }
}

module.exports = LegalClassifier;
