const { parsed: env } = require("dotenv").config();

const BASE_URL = env?.VITE_API_BASE_URL ?? "";

/**
 * สร้าง URL สำหรับไฟล์ใน uploads/
 * @param {string|null} filename
 * @returns {string|null}
 */
const buildFileUrl = (filename) =>
  filename ? `${BASE_URL}uploads/${filename}` : null;

module.exports = { buildFileUrl };
