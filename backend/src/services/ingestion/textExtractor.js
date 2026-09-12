const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const AppError = require('../../utils/appError');
const { REJECTION_CODES } = require('../../config/constants');
const logger = require('../../utils/logger');

class TextExtractor {
  /**
   * Extracts text content from PDF, DOCX, or TXT buffer.
   * Enforces minimum character threshold (>50 chars).
   */
  static async extract(fileBuffer, mimeType, filename) {
    let extractedText = '';

    try {
      if (mimeType === 'application/pdf') {
        extractedText = await this.extractFromPdf(fileBuffer);
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        filename.endsWith('.docx')
      ) {
        extractedText = await this.extractFromDocx(fileBuffer);
      } else if (mimeType === 'text/plain' || filename.endsWith('.txt')) {
        extractedText = fileBuffer.toString('utf-8');
      } else {
        throw new AppError(
          `Cannot extract text from unsupported MIME: ${mimeType}`,
          422,
          REJECTION_CODES.UNSUPPORTED_FORMAT,
          null,
          'TEXT_EXTRACTION'
        );
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Text extraction failed for ${filename}:`, { error: err.message });
      throw new AppError(
        `Failed to parse document structure. File is damaged or corrupted: ${err.message}`,
        422,
        REJECTION_CODES.CORRUPTED_FILE,
        { originalError: err.message },
        'TEXT_EXTRACTION'
      );
    }

    // Clean whitespace and normalize line endings
    const normalizedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

    // Empty Document Check: minimum non-whitespace characters
    const nonWhitespaceCount = normalizedText.replace(/\s+/g, '').length;
    if (nonWhitespaceCount < 50) {
      throw new AppError(
        `Extracted document contains insufficient text content (${nonWhitespaceCount} characters). Minimum 50 characters required for legal indexing.`,
        422,
        REJECTION_CODES.EMPTY_DOCUMENT,
        { characterCount: nonWhitespaceCount },
        'TEXT_EXTRACTION'
      );
    }

    return normalizedText;
  }

  static async extractFromPdf(buffer) {
    const data = await pdfParse(buffer, {
      pagerender: (pageData) => {
        return pageData.getTextContent().then((textContent) => {
          let lastY, text = '';
          for (let item of textContent.items) {
            if (lastY == item.transform[5] || !lastY) {
              text += item.str;
            } else {
              text += '\n' + item.str;
            }
            lastY = item.transform[5];
          }
          return text;
        });
      }
    });
    return data.text;
  }

  static async extractFromDocx(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
}

module.exports = TextExtractor;
