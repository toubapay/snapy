import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${nanoid(10)}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === "audio") {
      if (!file.mimetype.startsWith("audio/")) {
        return cb(new Error("Seuls les fichiers audio sont autorisés"));
      }
      return cb(null, true);
    }
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Seuls les fichiers image sont autorisés"));
    }
    cb(null, true);
  }
});

export function deleteUploadedFile(imageUrl) {
  if (!imageUrl) return;
  fs.unlink(path.join(UPLOADS_DIR, path.basename(imageUrl)), () => {});
}
