const path = require('path');
const multer = require('multer');
const AppError = require('../utils/AppError');
const { uploadsDir } = require('../utils/files');

const diskStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadsDir());
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

const storage = process.env.VERCEL ? multer.memoryStorage() : diskStorage;

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      cb(new AppError('Logo must be a PNG, JPG, or WebP image', 400));
      return;
    }
    cb(null, true);
  },
});

function uploadLogo(req, res, next) {
  upload.single('logo')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof AppError) return next(err);
    if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError('Logo must be 2 MB or smaller', 400));
    return next(new AppError(err.message || 'Upload failed', 400));
  });
}

module.exports = { uploadLogo };
