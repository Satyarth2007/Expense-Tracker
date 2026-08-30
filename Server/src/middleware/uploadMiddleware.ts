import multer from "multer";

export const uploadCsv = multer({
  storage: multer.memoryStorage(), // file lives in RAM only long enough to parse, never touches disk
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});