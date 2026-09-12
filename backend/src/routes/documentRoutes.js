const express = require('express');
const router = express.Router();
const DocumentController = require('../controllers/documentController');
const upload = require('../middlewares/uploadMiddleware');
const { uploadLimiter } = require('../middlewares/rateLimiter');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

// POST /api/v1/documents/upload - 9-Stage Ingestion Pipeline (Admin Only)
router.post('/upload', authenticate, requireRole(['admin']), uploadLimiter, upload.single('file'), DocumentController.uploadDocument);

// POST /api/v1/documents/upload-url - Fetch and index online legal document directly (Admin Only)
router.post('/upload-url', authenticate, requireRole(['admin']), uploadLimiter, DocumentController.uploadFromUrl);

// GET /api/v1/documents - List indexed UK legal documents
router.get('/', DocumentController.getDocuments);

// GET /api/v1/documents/rejections - Rejections audit log (Admin Only)
router.get('/rejections', authenticate, requireRole(['admin']), DocumentController.getRejections);

// GET /api/v1/documents/:id - Single document metadata
router.get('/:id', DocumentController.getDocumentById);

// GET /api/v1/documents/:id/content - Full document text content for viewing
router.get('/:id/content', DocumentController.getDocumentContent);

// GET /api/v1/documents/:id/download - Download file or exported text
router.get('/:id/download', DocumentController.downloadDocument);

// GET /api/v1/documents/:id/chunks - Chunks with paragraph anchors
router.get('/:id/chunks', DocumentController.getDocumentChunks);

// DELETE /api/v1/documents/:id - Atomic deletion from Mongo & Qdrant (Admin Only)
router.delete('/:id', authenticate, requireRole(['admin']), DocumentController.deleteDocument);

module.exports = router;
