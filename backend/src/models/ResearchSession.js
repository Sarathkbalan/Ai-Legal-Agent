const mongoose = require('mongoose');

const ResearchQuerySchema = new mongoose.Schema({
  userPrompt: { type: String, required: true },
  sanitizedPrompt: { type: String, required: true },

  // Prompt Guard 2 Security Verification
  securityGuardrail: {
    passed: { type: Boolean, required: true },
    riskScore: { type: Number, required: true },
    classification: { type: String, enum: ['benign', 'injection', 'jailbreak'], default: 'benign' }
  },

  // RAG Execution Details
  retrievalMetadata: {
    expandedQuery: { type: String },
    appliedFilters: {
      jurisdiction: { type: String },
      court: { type: String },
      yearRange: { start: Number, end: Number }
    },
    retrievedChunksCount: { type: Number },
    topScore: { type: Number }
  },

  retrievedChunks: [{
    chunkId: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentChunk' },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    qdrantPointId: { type: String },
    score: { type: Number },
    rerankScore: { type: Number },
    citation: { type: String },
    paragraphs: [{ type: Number }],
    snippet: { type: String }
  }],

  // Model Synthesis (UK Legal IRAC Structure)
  synthesis: {
    rawAnswer: { type: String },
    structuredIrac: {
      issue: { type: String },
      rule: { type: String },
      application: { type: String },
      conclusion: { type: String }
    },
    llmModel: { type: String, default: 'openai/gpt-oss-120b' }
  },

  // Post-generation Citation Audit
  citationValidation: [{
    citation: { type: String },
    citedParagraph: { type: String },
    isVerifiedInContext: { type: Boolean },
    sourceChunkId: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentChunk', default: null },
    snippetMatchConfidence: { type: Number }
  }],

  latency: {
    guardrailMs: { type: Number, default: 0 },
    retrievalMs: { type: Number, default: 0 },
    rerankMs: { type: Number, default: 0 },
    synthesisMs: { type: Number, default: 0 },
    citationValidationMs: { type: Number, default: 0 },
    totalDurationMs: { type: Number, default: 0 }
  },

  createdAt: { type: Date, default: Date.now }
});

const ResearchSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  title: { type: String, default: 'New UK Legal Research Session' },
  queries: [ResearchQuerySchema],
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('ResearchSession', ResearchSessionSchema);
