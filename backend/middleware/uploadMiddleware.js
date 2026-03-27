/**
 * Multer Upload Configuration — PM Internship Scheme
 * middleware/uploadMiddleware.js
 *
 * Handles PDF resume uploads:
 * - PDF only
 * - Max 2MB
 * - Saved to /uploads/resumes/
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── Storage Engine ──────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Format: resume_<candidateId>_<timestamp>.pdf
    const uniqueName = `resume_${req.params.id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// ─── File Filter — PDF Only ───────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for resume upload.'), false);
  }
};

// ─── Multer Instance ──────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
});

module.exports = upload;
