const JURISDICTIONS = {
  ENGLAND_WALES: 'England & Wales',
  SCOTLAND: 'Scotland',
  NORTHERN_IRELAND: 'Northern Ireland',
  UK_WIDE: 'UK Wide'
};

const UK_COURTS = [
  'UK Supreme Court',
  'Privy Council',
  'Court of Appeal (Civil Division)',
  'Court of Appeal (Criminal Division)',
  'High Court (King\'s Bench Division)',
  'High Court (Chancery Division)',
  'High Court (Family Division)',
  'Crown Court',
  'Employment Appeal Tribunal',
  'Upper Tribunal',
  'Court of Session (Inner House)',
  'Court of Session (Outer House)',
  'High Court of Justiciary',
  'Court of Appeal in Northern Ireland',
  'High Court of Justice in Northern Ireland',
  'UK Parliament (Act of Parliament)',
  'Statutory Instrument',
  'Other UK Court/Tribunal'
];

const COURT_TIERS = {
  'UK Supreme Court': 1,
  'Privy Council': 1,
  'Court of Appeal (Civil Division)': 2,
  'Court of Appeal (Criminal Division)': 2,
  'Court of Session (Inner House)': 2,
  'Court of Appeal in Northern Ireland': 2,
  'High Court (King\'s Bench Division)': 3,
  'High Court (Chancery Division)': 3,
  'High Court (Family Division)': 3,
  'Court of Session (Outer House)': 3,
  'High Court of Justiciary': 3,
  'High Court of Justice in Northern Ireland': 3,
  'Upper Tribunal': 3,
  'Employment Appeal Tribunal': 3,
  'Crown Court': 4,
  'UK Parliament (Act of Parliament)': 1,
  'Statutory Instrument': 2,
  'Other UK Court/Tribunal': 4
};

const LEGAL_DOMAINS = [
  'Contract Law',
  'Tort Law',
  'Constitutional & Administrative Law',
  'Criminal Law',
  'Land & Property Law',
  'Equity & Trusts',
  'Commercial & Company Law',
  'Employment Law',
  'Family Law',
  'Human Rights',
  'Tax & Revenue Law',
  'European Union (Retained)',
  'Intellectual Property',
  'Civil Procedure',
  'General UK Law'
];

const REJECTION_CODES = {
  CORRUPTED_FILE: 'CORRUPTED_FILE',
  EMPTY_DOCUMENT: 'EMPTY_DOCUMENT',
  DUPLICATE_DOCUMENT: 'DUPLICATE_DOCUMENT',
  NEAR_DUPLICATE_DOCUMENT: 'NEAR_DUPLICATE_DOCUMENT',
  NON_LEGAL_DOCUMENT: 'NON_LEGAL_DOCUMENT',
  NON_UK_LEGAL_DOCUMENT: 'NON_UK_LEGAL_DOCUMENT',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  EXTRACTION_FAILURE: 'EXTRACTION_FAILURE'
};

const DOCUMENT_STATUS = {
  PENDING: 'pending',
  VALIDATING: 'validating',
  EXTRACTING: 'extracting',
  CLASSIFYING: 'classifying',
  DETECTING_JURISDICTION: 'detecting_jurisdiction',
  EXTRACTING_METADATA: 'extracting_metadata',
  CHUNKING: 'chunking',
  EMBEDDING: 'embedding',
  INDEXED: 'indexed',
  REJECTED: 'rejected',
  FAILED: 'failed'
};

module.exports = {
  JURISDICTIONS,
  UK_COURTS,
  COURT_TIERS,
  LEGAL_DOMAINS,
  REJECTION_CODES,
  DOCUMENT_STATUS
};
