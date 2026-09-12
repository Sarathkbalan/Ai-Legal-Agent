const mongoose = require('mongoose');
const { JURISDICTIONS, UK_COURTS, LEGAL_DOMAINS, DOCUMENT_STATUS, REJECTION_CODES } = require('../config/constants');

const DocumentSchema = new mongoose.Schema({
  filename: { type: String, required: true, trim: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileHash: { type: String, required: true, index: true },
  simHash: { type: String, required: true, index: true },

  status: {
    type: String,
    enum: Object.values(DOCUMENT_STATUS),
    default: DOCUMENT_STATUS.PENDING,
    index: true
  },

  rejectionReason: {
    type: String,
    enum: [...Object.values(REJECTION_CODES), null],
    default: null,
    index: true
  },
  rejectionDetails: { type: String, default: null },

  legalMetadata: {
    title: { type: String, default: 'Untitled UK Legal Authority' },
    neutralCitation: { type: String, index: true, default: null },
    alternativeCitations: [{ type: String }],
    court: {
      type: String,
      enum: UK_COURTS,
      default: 'Other UK Court/Tribunal',
      index: true
    },
    courtTier: { type: Number, default: 4 },
    jurisdiction: {
      type: String,
      enum: Object.values(JURISDICTIONS),
      default: JURISDICTIONS.UK_WIDE,
      index: true
    },
    judgmentDate: { type: Date, default: null },
    year: { type: Number, index: true, default: null },
    judges: [{ type: String }],
    parties: {
      claimantAppellant: { type: String, default: null },
      defendantRespondent: { type: String, default: null }
    },
    legalDomains: [{
      type: String,
      enum: LEGAL_DOMAINS,
      default: ['General UK Law']
    }],
    statutesCited: [{ type: String }]
  },

  stats: {
    totalCharacters: { type: Number, default: 0 },
    wordCount: { type: Number, default: 0 },
    chunkCount: { type: Number, default: 0 },
    processingDurationMs: { type: Number, default: 0 }
  },

  rawContent: { type: String, default: null },
  filePath: { type: String, default: null }
}, {
  timestamps: true
});

DocumentSchema.index({ status: 1, createdAt: -1 });
DocumentSchema.index({ 'legalMetadata.jurisdiction': 1, 'legalMetadata.court': 1 });

module.exports = mongoose.model('Document', DocumentSchema);
