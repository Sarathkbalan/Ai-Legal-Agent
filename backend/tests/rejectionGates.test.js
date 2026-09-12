const { describe, it } = require('node:test');
const assert = require('node:assert');
const FileValidator = require('../src/services/ingestion/fileValidator');
const TextExtractor = require('../src/services/ingestion/textExtractor');
const LegalClassifier = require('../src/services/ingestion/legalClassifier');
const JurisdictionDetector = require('../src/services/ingestion/jurisdictionDetector');
const DuplicateDetector = require('../src/services/ingestion/duplicateDetector');
const { REJECTION_CODES } = require('../src/config/constants');
const AppError = require('../src/utils/appError');

describe('Strict Ingestion Rejection Gates', () => {

  // TC-1: Empty file rejection
  it('TC-1: Rejects empty document (0 bytes)', async () => {
    const emptyFile = {
      buffer: Buffer.alloc(0),
      size: 0,
      originalname: 'empty.pdf'
    };

    await assert.rejects(
      async () => {
        await FileValidator.validate(emptyFile);
      },
      (err) => {
        assert(err instanceof AppError);
        assert.strictEqual(err.statusCode, 422);
        assert.strictEqual(err.code, REJECTION_CODES.EMPTY_DOCUMENT);
        return true;
      }
    );
  });

  // TC-2: Corrupted file / Invalid magic bytes
  it('TC-2: Rejects corrupted binary disguised as PDF', async () => {
    const corruptFile = {
      buffer: Buffer.from('NOT_A_REAL_PDF_HEADER_JUST_RANDOM_CORRUPT_BYTES_XYZ_123'),
      size: 55,
      originalname: 'fake_judgment.pdf'
    };

    await assert.rejects(
      async () => {
        await FileValidator.validate(corruptFile);
      },
      (err) => {
        assert(err instanceof AppError);
        assert.strictEqual(err.statusCode, 422);
        assert.strictEqual(err.code, REJECTION_CODES.CORRUPTED_FILE);
        return true;
      }
    );
  });

  // TC-3: Document with < 50 characters of non-whitespace
  it('TC-3: Rejects document with insufficient text (<50 characters)', async () => {
    const sparseBuffer = Buffer.from('   \n\n  Too short text  \n  ');
    await assert.rejects(
      async () => {
        await TextExtractor.extract(sparseBuffer, 'text/plain', 'short.txt');
      },
      (err) => {
        assert(err instanceof AppError);
        assert.strictEqual(err.statusCode, 422);
        assert.strictEqual(err.code, REJECTION_CODES.EMPTY_DOCUMENT);
        return true;
      }
    );
  });

  // TC-4: Rejection of non-legal documents (e.g. car comparison / invoice)
  it('TC-4: Rejects non-legal document (car brochure / invoice)', () => {
    const carComparisonText = `
Mahindra XUV 3XO
REVX M(O) vs MX3
Petrol Manual • Feature & Value Comparison
This comparison uses Mahindra's currently listed XUV 3XO variant information.
1. Quick Comparison:
Fuel / Engine: 1.2L Turbo Petrol
Power: 82 kW (111.5 PS approx.)
Torque: 200 Nm
Transmission: 6-speed Manual
Boot space: 364 L
Sunroof: Single-pane
Price: Rs 8.91 lakh ex-showroom vs 9.19 lakh ex-showroom.
`;

    assert.throws(
      () => {
        LegalClassifier.classify(carComparisonText, 'car_comparison.txt');
      },
      (err) => {
        assert(err instanceof AppError);
        assert.strictEqual(err.statusCode, 422);
        assert.strictEqual(err.code, REJECTION_CODES.NON_LEGAL_DOCUMENT);
        return true;
      }
    );
  });

  // TC-5: Rejection of non-UK legal documents (e.g. US Supreme Court opinion)
  it('TC-5: Rejects non-UK legal document (US Supreme Court / US Code)', () => {
    const usCaseText = `
SUPREME COURT OF THE UNITED STATES
Syllabus

BROWN et al. v. BOARD OF EDUCATION OF TOPEKA et al.
APPEAL FROM THE UNITED STATES DISTRICT COURT FOR THE DISTRICT OF KANSAS

No. 1. Argued December 9, 1952 — Reargued December 8, 1953 — Decided May 17, 1954
347 U.S. 483 (1954)

Segregation of children in public schools solely on the basis of race deprives the children of equal educational opportunities.
Under the Fourteenth Amendment to the Constitution of the United States and Title 42 U.S.C. § 1983.
`;

    assert.throws(
      () => {
        JurisdictionDetector.detect(usCaseText, 'brown_v_board_us.txt');
      },
      (err) => {
        assert(err instanceof AppError);
        assert.strictEqual(err.statusCode, 422);
        assert.strictEqual(err.code, REJECTION_CODES.NON_UK_LEGAL_DOCUMENT);
        return true;
      }
    );
  });

  // TC-6: Acceptance of authentic UK Supreme Court judgment
  it('TC-6: Successfully validates and accepts authentic UK Supreme Court judgment', () => {
    const ukCaseText = `
IN THE SUPREME COURT OF THE UNITED KINGDOM
ON APPEAL FROM THE COURT OF APPEAL (CIVIL DIVISION)
Neutral Citation Number: [2020] UKSC 13

BETWEEN:
Barclays Bank plc
Appellant
-v-
Various Claimants
Respondents

Before: Lady Hale, Lord Reed, Lord Kerr, Lord Hodge, Lady Black
JUDGMENT

[1] This appeal is concerned with the doctrine of vicarious liability. The question is whether an employer can be liable in tort for an independent contractor.
`;

    const classification = LegalClassifier.classify(ukCaseText, 'barclays.txt');
    assert.strictEqual(classification.isLegal, true);

    const jurisdiction = JurisdictionDetector.detect(ukCaseText, 'barclays.txt');
    assert.strictEqual(jurisdiction.isUk, true);
    assert.strictEqual(jurisdiction.detectedCitation, '[2020] UKSC 13');
  });

  // TC-7: Acceptance of UK Acts of Parliament
  it('TC-7: Successfully validates and classifies Acts of Parliament', () => {
    const statuteText = `
Human Rights Act 1998
1998 CHAPTER 42

Be it enacted by the Queen's most Excellent Majesty, by and with the advice and consent of the Lords Spiritual and Temporal, and Commons, in this present Parliament assembled...
Section 1: The Convention Rights
`;

    const classification = LegalClassifier.classify(statuteText, 'hra_1998.txt');
    assert.strictEqual(classification.isLegal, true);

    const jurisdiction = JurisdictionDetector.detect(statuteText, 'hra_1998.txt');
    assert.strictEqual(jurisdiction.isUk, true);
    assert.strictEqual(jurisdiction.detectedCourt, 'UK Parliament (Act of Parliament)');
  });

  // TC-8: Acceptance of Commercial Agreement under English Law
  it('TC-8: Successfully validates commercial contracts under English Law', () => {
    const contractText = `
COMMERCIAL SERVICES AGREEMENT
THIS AGREEMENT is entered into on 12 March 2024
BETWEEN: Acme Supplies Limited and Global Tech Inc.
Clause 1: Obligations and Warranties
The service provider warrants compliance with the Supply of Goods and Services Act 1982.
Clause 22: Governing law shall be the laws of England and Wales.
The parties submit to the exclusive jurisdiction of the English courts.
`;

    const classification = LegalClassifier.classify(contractText, 'agreement.txt');
    assert.strictEqual(classification.isLegal, true);

    const jurisdiction = JurisdictionDetector.detect(contractText, 'agreement.txt');
    assert.strictEqual(jurisdiction.isUk, true);
    assert.strictEqual(jurisdiction.jurisdiction, 'England & Wales');
  });

  // TC-9: Acceptance of general UK-related documents without strict legal thresholds
  it('TC-9: Successfully accepts UK-related document (e.g. UK policy / advisory report) without strict thresholds', () => {
    const ukDocText = `
Metropolitan Police Service — Annual Operational Guidance Note
London, United Kingdom
This guidance report outlines procedures for community engagement and safety across boroughs in Greater London.
All officers operating in England and Wales are required to uphold standards established under Home Office protocols.
Budgets and funding of £15,000,000 have been allocated for local community safety initiatives.
`;

    const classification = LegalClassifier.classify(ukDocText, 'police_guidance.txt');
    assert.strictEqual(classification.isLegal, true);

    const jurisdiction = JurisdictionDetector.detect(ukDocText, 'police_guidance.txt');
    assert.strictEqual(jurisdiction.isUk, true);
    assert.strictEqual(jurisdiction.jurisdiction, 'England & Wales');
  });
});
