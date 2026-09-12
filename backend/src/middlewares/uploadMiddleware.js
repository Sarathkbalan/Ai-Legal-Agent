const multer = require('multer');
const AppError = require('../utils/appError');
const { REJECTION_CODES } = require('../config/constants');

const maxMb = parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: maxMb * 1024 * 1024,
    files: 5
  },
  fileFilter: (req, file, cb) => {
    // Basic extension pre-filter; detailed magic-byte inspection is handled in FileValidator
    const validExts = ['.pdf', '.docx', '.txt'];
    const lowerName = file.originalname.toLowerCase();
    const hasValidExt = validExts.some((ext) => lowerName.endsWith(ext));

    if (!hasValidExt) {
      return cb(
        new AppError(
          `File extension not supported. Upload only PDF, DOCX, or TXT documents.`,
          422,
          REJECTION_CODES.UNSUPPORTED_FORMAT,
          { filename: file.originalname },
          'UPLOAD_FILTER'
        )
      );
    }
    cb(null, true);
  }
});

module.exports = upload;
