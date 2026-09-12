const FileType = require('file-type');
const AppError = require('../../utils/appError');
const { REJECTION_CODES } = require('../../config/constants');
const logger = require('../../utils/logger');

class FileValidator {
  /**
   * Validates file presence, size, magic bytes, and basic integrity.
   * @param {Object} file - Multer file object with buffer, mimetype, originalname
   */
  static async validate(file) {
    if (!file || !file.buffer) {
      throw new AppError('No file buffer received', 422, REJECTION_CODES.EMPTY_DOCUMENT, null, 'FILE_VALIDATION');
    }

    // 1. Empty file check
    if (file.size === 0 || file.buffer.length === 0) {
      throw new AppError(
        'Document is completely empty (0 bytes). Upload rejected.',
        422,
        REJECTION_CODES.EMPTY_DOCUMENT,
        { fileSize: 0 },
        'FILE_VALIDATION'
      );
    }

    // 2. Maximum file size check (default 25MB)
    const maxMb = parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10);
    const maxBytes = maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new AppError(
        `Document size exceeds maximum permitted limit of ${maxMb}MB.`,
        422,
        REJECTION_CODES.UNSUPPORTED_FORMAT,
        { fileSize: file.size, maxBytes },
        'FILE_VALIDATION'
      );
    }

    // 3. Magic Bytes Inspection
    const detectedType = await FileType.fromBuffer(file.buffer);
    const originalExt = file.originalname.split('.').pop()?.toLowerCase();

    // Plain text files do not have a binary magic number
    if (!detectedType) {
      if (originalExt === 'txt') {
        // Plain text validation: check for null bytes which indicate binary disguised as text
        if (file.buffer.includes(0x00)) {
          throw new AppError(
            'File contains illegal binary/null bytes. Corrupted or invalid text document.',
            422,
            REJECTION_CODES.CORRUPTED_FILE,
            { detectedMime: 'application/octet-stream', extension: originalExt },
            'FILE_VALIDATION'
          );
        }
        return { mimeType: 'text/plain', ext: 'txt' };
      }

      throw new AppError(
        'Unable to verify file signature. Corrupted or unrecognized file format.',
        422,
        REJECTION_CODES.CORRUPTED_FILE,
        { extension: originalExt },
        'FILE_VALIDATION'
      );
    }

    // PDF Validation
    if (detectedType.mime === 'application/pdf') {
      // Verify PDF header magic bytes: %PDF-
      const headerStr = file.buffer.slice(0, 8).toString('utf-8');
      if (!headerStr.startsWith('%PDF-')) {
        throw new AppError(
          'Invalid or corrupted PDF header structure.',
          422,
          REJECTION_CODES.CORRUPTED_FILE,
          { header: headerStr },
          'FILE_VALIDATION'
        );
      }
      return { mimeType: 'application/pdf', ext: 'pdf' };
    }

    // DOCX Validation (ZIP format containing [Content_Types].xml)
    if (
      detectedType.mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      (detectedType.mime === 'application/zip' && originalExt === 'docx')
    ) {
      return {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ext: 'docx'
      };
    }

    // Any other type is unsupported
    throw new AppError(
      `Unsupported file type detected: ${detectedType.mime}. Only PDF, DOCX, and TXT UK legal documents are accepted.`,
      422,
      REJECTION_CODES.UNSUPPORTED_FORMAT,
      { detectedMime: detectedType.mime, originalExtension: originalExt },
      'FILE_VALIDATION'
    );
  }
}

module.exports = FileValidator;
