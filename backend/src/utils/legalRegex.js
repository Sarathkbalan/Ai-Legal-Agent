// Regular expressions for UK legal document parsing and foreign jurisdiction rejection

// UK Neutral Citations
const UK_NEUTRAL_CITATION_PATTERNS = [
  /\[(\d{4})\]\s+UKSC\s+(\d+)/i,                     // UK Supreme Court
  /\[(\d{4})\]\s+UKPC\s+(\d+)/i,                     // Judicial Committee of Privy Council
  /\[(\d{4})\]\s+EWCA\s+(Civ|Crim)\s+(\d+)/i,         // Court of Appeal England & Wales
  /\[(\d{4})\]\s+EWHC\s+(\d+)\s*\((Admin|Ch|Comm|KB|QB|Fam|TCC|Pat|IPEC)\)/i, // High Court
  /\[(\d{4})\]\s+EWHC\s+(\d+)/i,                     // High Court generic
  /\[(\d{4})\]\s+UKUT\s+(\d+)\s*\((AAC|IAC|LC|TCC)\)/i, // Upper Tribunal
  /\[(\d{4})\]\s+CAT\s+(\d+)/i,                      // Competition Appeal Tribunal
  /\[(\d{4})\]\s+CSIH\s+(\d+)/i,                     // Court of Session Inner House (Scotland)
  /\[(\d{4})\]\s+CSOH\s+(\d+)/i,                     // Court of Session Outer House (Scotland)
  /\[(\d{4})\]\s+HCJAC\s+(\d+)/i,                    // High Court of Justiciary Appeal Court
  /\[(\d{4})\]\s+NICA\s+(\d+)/i,                     // Northern Ireland Court of Appeal
  /\[(\d{4})\]\s+NIKB\s+(\d+)/i,                     // Northern Ireland King's Bench
  /\[(\d{4})\]\s+NIQB\s+(\d+)/i,                     // Northern Ireland Queen's Bench
  /\[(\d{4})\]\s+EWFC\s+(\d+)/i                      // Family Court
];

// UK Law Reports and Secondary Citations
const UK_LAW_REPORT_PATTERNS = [
  /\[(\d{4})\]\s+(\d*)\s*(AC|All\s+ER|WLR|QB|KB|Ch|Fam|Cr\s+App\s+R|ICR|IRLR|BCLC)\s+(\d+)/i,
  /\((\d{4})\)\s+(\d*)\s*(AC|All\s+ER|WLR|QB|KB|Ch|Fam|Cr\s+App\s+R|ICR|IRLR)\s+(\d+)/i
];

// UK Acts of Parliament & Statutory Instruments
const UK_STATUTE_PATTERNS = [
  /\b([A-Z][a-zA-Z0-9,'-]+(?:\s+[A-Z][a-zA-Z0-9,'-]+){0,5})\s+Act\s+(1[89]\d\d|20[0-2]\d)\b/g,
  /\b(?:S\.I\.\s*(1[89]\d\d|20[0-2]\d)\/\d+|Statutory\s+Instruments?\s+(1[89]\d\d|20[0-2]\d)\s+No\.\s*\d+)\b/gi
];

// UK Statutory Enactment Formula
const UK_ENACTMENT_REGEX = /Be it enacted by the (?:Queen's|King's) most Excellent Majesty/i;

// UK Court Header Indicators
const UK_COURT_HEADERS = [
  /IN THE SUPREME COURT OF THE UNITED KINGDOM/i,
  /IN THE HIGH COURT OF JUSTICE/i,
  /IN THE COURT OF APPEAL/i,
  /ROYAL COURTS OF JUSTICE/i,
  /STRAND, LONDON/i,
  /PARLIAMENT HOUSE, EDINBURGH/i,
  /ROYAL COURTS OF JUSTICE, BELFAST/i,
  /HIGH COURT OF JUSTICIARY/i,
  /COURT OF SESSION/i,
  /NEUTRAL CITATION NUMBER:/i
];

// Pinpoint Paragraph Pattern: [1], [24], or newline followed by 12.
const PARAGRAPH_ANCHOR_REGEX = /(?:^|\n)\s*\[(\d+)\]\s+/g;
const STATUTE_SECTION_REGEX = /(?:^|\n)\s*(?:section|s\.)\s*(\d+[A-Za-z]?(?:\(\d+\)(?:\([a-z]\))?)?)\b/gi;

// Foreign Jurisdiction Indicators (Strict Rejection Targets)
const FOREIGN_JURISDICTION_PATTERNS = [
  // US Federal & State Citations
  { name: 'US Supreme Court Citation', regex: /\b\d+\s+U\.?S\.?\s+\d+\b/i },
  { name: 'US Supreme Court Reporter', regex: /\b\d+\s+S\.?\s*Ct\.?\s+\d+\b/i },
  { name: 'US Federal Reporter', regex: /\b\d+\s+F\.(?:2d|3d|4th)\s+\d+\b/i },
  { name: 'US Federal Supplement', regex: /\b\d+\s+F\.\s*Supp\.(?:2d|3d)?\s+\d+\b/i },
  { name: 'US Code Citation', regex: /\b\d+\s+U\.?S\.?C\.?\s*(?:§|sec|section)?\s*\d+\b/i },
  { name: 'US Federal Court Name', regex: /United States District Court|United States Court of Appeals|Supreme Court of the United States/i },
  { name: 'US State Court Reporter', regex: /\b(?:Cal\. App\.|N\.Y\.S\.2d|P\.3d|So\.3d|A\.3d|N\.E\.3d)\b/i },
  
  // Australian Citations
  { name: 'High Court of Australia', regex: /\[(\d{4})\]\s+HCA\s+\d+|\b\d+\s+CLR\s+\d+\b/i },
  { name: 'Federal Court of Australia', regex: /\[(\d{4})\]\s+FCA\s+\d+/i },

  // Canadian Citations
  { name: 'Supreme Court of Canada', regex: /\[(\d{4})\]\s+\d+\s+SCR\s+\d+|\[(\d{4})\]\s+SCC\s+\d+/i },

  // Indian Citations
  { name: 'Supreme Court of India', regex: /\bAIR\s+\d{4}\s+SC\s+\d+\b|\b\d{4}\s+SCR\s+\d+\b/i }
];

module.exports = {
  UK_NEUTRAL_CITATION_PATTERNS,
  UK_LAW_REPORT_PATTERNS,
  UK_STATUTE_PATTERNS,
  UK_ENACTMENT_REGEX,
  UK_COURT_HEADERS,
  PARAGRAPH_ANCHOR_REGEX,
  STATUTE_SECTION_REGEX,
  FOREIGN_JURISDICTION_PATTERNS
};
