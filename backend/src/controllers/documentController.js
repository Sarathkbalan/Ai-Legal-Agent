const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const FileValidator = require('../services/ingestion/fileValidator');
const DuplicateDetector = require('../services/ingestion/duplicateDetector');
const TextExtractor = require('../services/ingestion/textExtractor');
const LegalClassifier = require('../services/ingestion/legalClassifier');
const JurisdictionDetector = require('../services/ingestion/jurisdictionDetector');
const MetadataExtractor = require('../services/ingestion/metadataExtractor');
const LegalChunker = require('../services/ingestion/legalChunker');
const BgeEmbeddingService = require('../services/vector/bgeEmbeddingService');
const QdrantService = require('../services/vector/qdrantService');
const AuditService = require('../services/auditService');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { DOCUMENT_STATUS } = require('../config/constants');

class DocumentController {
  /**
   * Streamlined Ingestion Pipeline with UK Legal Verification & Graceful Indexing
   */
  static async ingestDocumentBuffer(fileObj, req) {
    const startTime = Date.now();
    logger.info(`Starting UK Legal Ingestion Pipeline for: ${fileObj.originalname} (${fileObj.size || fileObj.buffer?.length} bytes)`);

    // STAGE 1: File Integrity & Format Inspection
    const { mimeType } = await FileValidator.validate(fileObj);

    // STAGE 2A: Exact Duplicate Handling (Refresh instead of Reject)
    const fileHash = DuplicateDetector.generateFileHash(fileObj.buffer);
    const existingDuplicate = await DuplicateDetector.checkExactDuplicate(fileHash);
    if (existingDuplicate) {
      logger.info(`Refreshing existing indexed document ${existingDuplicate._id} (${existingDuplicate.originalName})`);
      try {
        await QdrantService.deleteByDocumentId(existingDuplicate._id);
        await DocumentChunk.deleteMany({ documentId: existingDuplicate._id });
        await Document.findByIdAndDelete(existingDuplicate._id);
      } catch (cleanErr) {
        logger.warn('Cleanup of previous duplicate chunks encountered warning:', cleanErr.message);
      }
    }

    // STAGE 3: Structured Text Extraction & Non-Empty Check
    const rawText = await TextExtractor.extract(fileObj.buffer, mimeType, fileObj.originalname);

    // STAGE 2B: Near-Duplicate Detection (Informational tracking, zero 422 rejections)
    const simHash = DuplicateDetector.generateSimHash(rawText);
    await DuplicateDetector.checkNearDuplicate(simHash, fileObj.originalname);

    // STAGE 4: Legal Document Classification & Verification
    const classification = LegalClassifier.classify(rawText, fileObj.originalname);

    // STAGE 5: UK Jurisdiction Detection & Verification
    const jurisdictionInfo = JurisdictionDetector.detect(rawText, fileObj.originalname);

    // STAGE 6: Legal Metadata & Citation Extraction
    const legalMetadata = MetadataExtractor.extract(rawText, fileObj.originalname, jurisdictionInfo);

    // STAGE 7: Legal-Structure Aware Chunking with Fallback Guarantee
    let chunks = LegalChunker.chunk(rawText, legalMetadata);
    if (!chunks || !chunks.length) {
      chunks = [{
        qdrantPointId: require('uuid').v4(),
        chunkIndex: 0,
        content: `[Authority: ${legalMetadata.title || 'UK Legal Authority'}]\n\n${rawText.slice(0, 3000)}`,
        tokenCount: Math.ceil(Math.min(rawText.length, 3000) / 4),
        paragraphNumbers: [],
        sectionTitle: null,
        metadata: {
          caseTitle: legalMetadata.title,
          neutralCitation: legalMetadata.neutralCitation,
          court: legalMetadata.court,
          jurisdiction: legalMetadata.jurisdiction,
          year: legalMetadata.year
        }
      }];
    }

    // Save physical file to uploads directory for full downloading
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const safeFilename = `${Date.now()}-${fileObj.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const savedFilePath = path.join(uploadDir, safeFilename);
    await fs.promises.writeFile(savedFilePath, fileObj.buffer);

    // Create Document in MongoDB with status 'embedding'
    const docRecord = await Document.create({
      filename: safeFilename,
      originalName: fileObj.originalname,
      mimeType,
      fileSize: fileObj.size || fileObj.buffer.length,
      fileHash,
      simHash,
      status: DOCUMENT_STATUS.EMBEDDING,
      legalMetadata,
      rawContent: rawText,
      filePath: savedFilePath,
      stats: {
        totalCharacters: rawText.length,
        wordCount: rawText.split(/\s+/).length,
        chunkCount: chunks.length
      }
    });

    // STAGE 8: BGE-M3 Dense Embedding Generation (1024-dim)
    const chunkTexts = chunks.map((c) => c.content);
    const embeddings = await BgeEmbeddingService.getEmbeddingsBatch(chunkTexts);

    // STAGE 9: Atomic Persistence (MongoDB Chunks + Qdrant Point Upsert)
    const chunkDocs = chunks.map((chunk) => ({
      ...chunk,
      documentId: docRecord._id
    }));
    const createdChunks = await DocumentChunk.insertMany(chunkDocs);

    // Upsert to Qdrant collection
    await QdrantService.upsertChunks(createdChunks, embeddings, docRecord._id, legalMetadata);

    // Update Document Status to 'indexed'
    const processingDurationMs = Date.now() - startTime;
    docRecord.status = DOCUMENT_STATUS.INDEXED;
    docRecord.stats.processingDurationMs = processingDurationMs;
    await docRecord.save();

    // Log success event
    await AuditService.logIndexed(
      docRecord._id,
      {
        title: legalMetadata.title,
        citation: legalMetadata.neutralCitation,
        chunks: chunks.length,
        processingDurationMs
      },
      req
    );

    logger.info(`UK legal document successfully ingested and indexed: ${legalMetadata.title} in ${processingDurationMs}ms`);

    return {
      docRecord,
      createdChunks,
      processingDurationMs,
      legalMetadata,
      classification,
      jurisdictionInfo
    };
  }

  /**
   * Uploads and indexes a local legal document via multipart form-data.
   */
  static async uploadDocument(req, res, next) {
    try {
      const file = req.file;
      if (!file) {
        throw new AppError('No legal document file provided in request body.', 422, 'EMPTY_DOCUMENT', null, 'UPLOAD_GATE');
      }

      const { docRecord, createdChunks, processingDurationMs, legalMetadata } = await DocumentController.ingestDocumentBuffer(file, req);

      res.status(201).json({
        success: true,
        message: `UK legal document verified and indexed successfully: ${legalMetadata.title || file.originalname}`,
        data: {
          document: docRecord,
          previewChunks: createdChunks.slice(0, 3)
        },
        meta: {
          processingDurationMs,
          stagesCompleted: 9,
          title: legalMetadata.title,
          jurisdiction: legalMetadata.jurisdiction,
          court: legalMetadata.court
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Fetches an authentic legal document directly from an online URL and indexes it into RAG.
   */
  static async uploadFromUrl(req, res, next) {
    try {
      const { url, filename: requestedName } = req.body;
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        throw new AppError('A valid HTTP or HTTPS document URL is required.', 400, 'INVALID_URL');
      }

      logger.info(`Fetching online legal document from URL: ${url}`);
      
      let fetchRes;
      try {
        fetchRes = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LawIntel-Legal-RAG/1.0',
            'Accept': 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,*/*'
          }
        });
      } catch (networkErr) {
        throw new AppError(`Failed to fetch online document: ${networkErr.message}`, 400, 'FETCH_FAILED');
      }

      if (!fetchRes.ok) {
        throw new AppError(`Remote server returned HTTP ${fetchRes.status}: ${fetchRes.statusText}`, 400, 'REMOTE_FETCH_ERROR');
      }

      const contentType = fetchRes.headers.get('content-type') || '';
      const arrayBuffer = await fetchRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (!buffer || buffer.length === 0) {
        throw new AppError('The fetched online document is empty (0 bytes).', 422, 'EMPTY_DOCUMENT', null, 'UPLOAD_GATE');
      }

      // Infer filename
      let originalname = requestedName;
      if (!originalname) {
        const contentDisposition = fetchRes.headers.get('content-disposition');
        if (contentDisposition) {
          const match = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i);
          if (match && match[1]) originalname = decodeURIComponent(match[1]);
        }
      }
      if (!originalname) {
        try {
          const parsedUrl = new URL(url);
          const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
          const lastSegment = pathSegments[pathSegments.length - 1];
          if (lastSegment && (lastSegment.endsWith('.pdf') || lastSegment.endsWith('.docx') || lastSegment.endsWith('.txt'))) {
            originalname = lastSegment;
          } else if (pathSegments.length >= 2) {
            originalname = `${pathSegments.slice(-3).join('_').replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`;
          }
        } catch (e) {}
      }
      if (!originalname) {
        originalname = `online_legal_doc_${Date.now()}.pdf`;
      }

      const { docRecord, createdChunks, processingDurationMs, legalMetadata } = await DocumentController.ingestDocumentBuffer({
        buffer,
        originalname,
        size: buffer.length,
        mimeType: contentType.split(';')[0].trim()
      }, req);

      res.status(201).json({
        success: true,
        message: `Online legal document successfully fetched from ${new URL(url).hostname}, validated, and indexed into RAG.`,
        data: {
          document: docRecord,
          previewChunks: createdChunks.slice(0, 3)
        },
        meta: {
          sourceUrl: url,
          processingDurationMs,
          stagesCompleted: 9,
          title: legalMetadata.title,
          neutralCitation: legalMetadata.neutralCitation
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieves paginated list of indexed UK legal documents.
   */
  static async getDocuments(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        jurisdiction,
        court,
        domain,
        search,
        status = 'indexed'
      } = req.query;

      const filter = {};
      if (status) filter.status = status;
      if (jurisdiction) filter['legalMetadata.jurisdiction'] = jurisdiction;
      if (court) filter['legalMetadata.court'] = court;
      if (domain) filter['legalMetadata.legalDomains'] = domain;
      if (search) {
        filter.$or = [
          { 'legalMetadata.title': { $regex: search, $options: 'i' } },
          { 'legalMetadata.neutralCitation': { $regex: search, $options: 'i' } },
          { originalName: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const [documents, total] = await Promise.all([
        Document.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit, 10)),
        Document.countDocuments(filter)
      ]);

      res.status(200).json({
        success: true,
        data: documents,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / parseInt(limit, 10))
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Gets full details of a specific legal document.
   */
  static async getDocumentById(req, res, next) {
    try {
      const doc = await Document.findById(req.params.id);
      if (!doc) {
        throw new AppError('Document not found', 404, 'NOT_FOUND');
      }

      const chunkCount = await DocumentChunk.countDocuments({ documentId: doc._id });

      res.status(200).json({
        success: true,
        data: {
          ...doc.toObject(),
          chunkCount
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieves all chunk anchors for a document.
   */
  static async getDocumentChunks(req, res, next) {
    try {
      const chunks = await DocumentChunk.find({ documentId: req.params.id })
        .sort({ chunkIndex: 1 });

      res.status(200).json({
        success: true,
        data: chunks
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Deletes a document and all related chunks from Mongo and Qdrant.
   */
  static async deleteDocument(req, res, next) {
    try {
      const doc = await Document.findById(req.params.id);
      if (!doc) {
        throw new AppError('Document not found', 404, 'NOT_FOUND');
      }

      // Delete physical file if exists
      if (doc.filePath && fs.existsSync(doc.filePath)) {
        try {
          fs.unlinkSync(doc.filePath);
        } catch (fErr) {
          logger.warn(`Could not delete file at ${doc.filePath}: ${fErr.message}`);
        }
      }

      // Delete vectors from Qdrant
      await QdrantService.deleteByDocumentId(doc._id);

      // Delete chunks from Mongo
      await DocumentChunk.deleteMany({ documentId: doc._id });

      // Delete document record
      await Document.findByIdAndDelete(doc._id);

      // Record audit
      await AuditService.logEvent('DOCUMENT_DELETED', 'INFO', {
        documentId: doc._id,
        title: doc.legalMetadata?.title,
        citation: doc.legalMetadata?.neutralCitation
      }, req);

      res.status(200).json({
        success: true,
        message: 'Document and vectors successfully deleted.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieves full document text content for in-app reading and paragraph review.
   */
  static async getDocumentContent(req, res, next) {
    try {
      const doc = await Document.findById(req.params.id);
      if (!doc) {
        throw new AppError('Document not found', 404, 'NOT_FOUND');
      }

      let content = doc.rawContent;

      // If rawContent was not saved (e.g. early seed), reconstruct from chunks
      if (!content) {
        const chunks = await DocumentChunk.find({ documentId: doc._id }).sort({ chunkIndex: 1 });
        if (chunks.length > 0) {
          content = chunks
            .map((c) => c.content.replace(/^\[(?:Authority|UK Legal Authority):[^\]]+\]\s*/i, '').trim())
            .join('\n\n');
          // Cache back onto document
          doc.rawContent = content;
          await doc.save();
        }
      }

      res.status(200).json({
        success: true,
        data: {
          documentId: doc._id,
          title: doc.legalMetadata?.title,
          neutralCitation: doc.legalMetadata?.neutralCitation,
          court: doc.legalMetadata?.court,
          jurisdiction: doc.legalMetadata?.jurisdiction,
          originalName: doc.originalName,
          mimeType: doc.mimeType,
          fileSize: doc.fileSize,
          content: content || 'No text content available for this document.'
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Downloads the uploaded legal document file or text export.
   */
  static async downloadDocument(req, res, next) {
    try {
      const doc = await Document.findById(req.params.id);
      if (!doc) {
        throw new AppError('Document not found', 404, 'NOT_FOUND');
      }

      // 1. If physical file exists on disk, download it directly
      if (doc.filePath && fs.existsSync(doc.filePath)) {
        return res.download(doc.filePath, doc.originalName);
      }

      // 2. Otherwise serve reconstructed text with Content-Disposition attachment header
      let content = doc.rawContent;
      if (!content) {
        const chunks = await DocumentChunk.find({ documentId: doc._id }).sort({ chunkIndex: 1 });
        content = chunks
          .map((c) => c.content.replace(/^\[(?:Authority|UK Legal Authority):[^\]]+\]\s*/i, '').trim())
          .join('\n\n');
      }

      const downloadName = doc.originalName || `${(doc.legalMetadata?.title || 'UK_Legal_Authority').replace(/[^a-zA-Z0-9_.-]/g, '_')}.txt`;
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
      res.setHeader('Content-Type', doc.mimeType || 'text/plain; charset=utf-8');
      res.send(content || 'Empty legal document content');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieves rejection audit log.
   */
  static async getRejections(req, res, next) {
    try {
      const rejections = await Document.find({ status: 'rejected' })
        .sort({ createdAt: -1 })
        .limit(50);

      res.status(200).json({
        success: true,
        data: rejections
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DocumentController;
