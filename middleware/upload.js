const multer = require("multer");
const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = "uploads";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// PDF only
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") return cb(null, true);
  req.fileValidationError = "กรุณาแนบไฟล์ PDF เท่านั้น";
  cb(null, false);
};

// PNG only (signature)
const pngFilter = (req, file, cb) => {
  if (file.mimetype === "image/png") return cb(null, true);
  req.errorMessage = "นามสกุลของไฟล์ไม่ใช่ png";
  cb(null, false);
};

const uploadPDF    = multer({ storage, fileFilter: pdfFilter });
const uploadPNG    = multer({ storage, fileFilter: pngFilter });
const uploadSingle = multer({ storage });

module.exports = { uploadPDF, uploadPNG, uploadSingle };
