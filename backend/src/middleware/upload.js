import multer from 'multer';

// Memory Storage
const storage = multer.memoryStorage();

// File type filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only image files are allowed!'), false);
  }
};

// Multer Upload Configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max size
  }
});

export default upload;
