const multer = require('multer');

// Configure in-memory storage for high-performance hashing and streaming to Supabase Storage
const storage = multer.memoryStorage();

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

/**
 * Middleware wrapper to cleanly catch Multer-specific errors (such as file size exceeded)
 */
function handleUpload(fieldName = 'file') {
  const singleUpload = upload.single(fieldName);

  return (req, res, next) => {
    singleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: `File size exceeds the 50MB limit.`
          });
        }
        return res.status(400).json({
          success: false,
          error: `Upload error: ${err.message}`
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          error: `File handling error: ${err.message}`
        });
      }
      next();
    });
  };
}

module.exports = {
  upload,
  handleUpload
};
