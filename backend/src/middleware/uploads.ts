import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import type { NextFunction, Request, Response } from "express";
import { env, maxUploadBytes, uploadRoot } from "../config/env.js";
import { randomToken } from "../utils/ids.js";
import { ApiError } from "../utils/http.js";

const publicRoot = path.resolve(uploadRoot, "public");
const privateRoot = path.resolve(uploadRoot, "private");
const publicImages = path.join(publicRoot, "images");
const admissionDocs = path.join(privateRoot, "admissions");

for (const dir of [publicImages, admissionDocs]) {
  fs.mkdirSync(dir, { recursive: true });
}

const documentExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp"]);
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function extensionOf(filename: string): string {
  return path.extname(filename).toLowerCase();
}

function safeFilename(original: string): string {
  const ext = extensionOf(original);
  return `${Date.now()}-${randomToken(12)}${ext}`;
}

const documentStorage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, admissionDocs),
  filename: (_req, file, callback) => callback(null, safeFilename(file.originalname))
});

const imageStorage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, publicImages),
  filename: (_req, file, callback) => callback(null, safeFilename(file.originalname))
});

export const admissionUpload = multer({
  storage: documentStorage,
  limits: { fileSize: maxUploadBytes, files: 3 },
  fileFilter: (_req, file, callback) => {
    const ext = extensionOf(file.originalname);
    const mimeAllowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
    if (!documentExtensions.has(ext) || !mimeAllowed) {
      return callback(new ApiError(400, "Only PDF, JPG, PNG, or WebP documents up to the allowed size are accepted."));
    }
    callback(null, true);
  }
});

export const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: maxUploadBytes, files: 1 },
  fileFilter: (_req, file, callback) => {
    const ext = extensionOf(file.originalname);
    if (!imageExtensions.has(ext) || !["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return callback(new ApiError(400, "Only JPG, PNG, or WebP images are accepted."));
    }
    callback(null, true);
  }
});

function hasExpectedMagic(filePath: string, allowed: "document" | "image"): boolean {
  const fd = fs.openSync(filePath, "r");
  const buffer = Buffer.alloc(12);
  try {
    fs.readSync(fd, buffer, 0, 12, 0);
  } finally {
    fs.closeSync(fd);
  }
  const isPdf = buffer.subarray(0, 4).toString() === "%PDF";
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
  if (allowed === "image") return isJpeg || isPng || isWebp;
  return isPdf || isJpeg || isPng || isWebp;
}

export function verifyDocumentContent(req: Request, _res: Response, next: NextFunction) {
  const files = (req.files as Express.Multer.File[] | undefined) || [];
  for (const file of files) {
    if (!hasExpectedMagic(file.path, "document")) {
      fs.unlink(file.path, () => undefined);
      return next(new ApiError(400, "An uploaded document has invalid content."));
    }
  }
  next();
}

export function verifyImageContent(req: Request, _res: Response, next: NextFunction) {
  const file = req.file;
  if (file && !hasExpectedMagic(file.path, "image")) {
    fs.unlink(file.path, () => undefined);
    return next(new ApiError(400, "The uploaded image has invalid content."));
  }
  next();
}

export function publicImagePath(filename: string): string {
  return `/uploads/public/images/${path.basename(filename)}`;
}

export { publicRoot, privateRoot, publicImages, admissionDocs };

export function uploadResponse(file: Express.Multer.File) {
  return {
    url: publicImagePath(file.filename),
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype
  };
}

export function ensureUploadDirs(): void {
  fs.mkdirSync(publicImages, { recursive: true });
  fs.mkdirSync(admissionDocs, { recursive: true });
}

export const uploadLimits = { fileSize: maxUploadBytes };
export const uploadEnvironment = env;
