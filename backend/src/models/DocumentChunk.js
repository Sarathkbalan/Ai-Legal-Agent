const mongoose = require('mongoose');

const DocumentChunkSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true
  },
  qdrantPointId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  chunkIndex: {
    type: Number,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  tokenCount: {
    type: Number,
    required: true
  },

  // Pinpoint Legal Anchors
  sectionTitle: { type: String, default: null },
  paragraphNumbers: [{ type: Number }],
  statuteSections: [{ type: String }],

  // Denormalized snapshot for quick retrieval without join
  metadata: {
    caseTitle: { type: String },
    neutralCitation: { type: String },
    court: { type: String },
    jurisdiction: { type: String },
    year: { type: Number }
  }
}, {
  timestamps: true
});

DocumentChunkSchema.index({ documentId: 1, chunkIndex: 1 });

module.exports = mongoose.model('DocumentChunk', DocumentChunkSchema);
