import crypto from 'node:crypto';
import path from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import { env } from '../config/env.js';
import { getImageKitClient } from '../config/imagekit.js';
import { logger } from '../config/logger.js';
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIMES,
  ALLOWED_RESOURCE_EXTENSIONS,
  ALLOWED_RESOURCE_MIMES,
} from '../constants/upload-limits.js';
import { AppError } from '../utils/app-error.js';

const localPrivateResourceStore = new Map();

function sanitizeExtension(originalName = '') {
  const baseName = path.basename(String(originalName));
  if (baseName.includes('..') || originalName.includes('..') || originalName.includes('/') || originalName.includes('\\')) {
    throw new AppError(400, 'INVALID_FILE_NAME', 'File name contains disallowed path characters.');
  }
  return path.extname(baseName).toLowerCase();
}

function detectMagicMime(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
    return null;
  }
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'application/pdf';
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

export async function validateAndUploadImage(file) {
  if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new AppError(400, 'EMPTY_FILE', 'Uploaded image file is empty or missing.');
  }
  if (file.buffer.length > env.maxImageSizeBytes) {
    throw new AppError(
      413,
      'FILE_TOO_LARGE',
      `Image exceeds the maximum size of ${env.maxImageSizeMb} MB.`
    );
  }

  const ext = sanitizeExtension(file.originalname);
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    throw new AppError(
      400,
      'UNSUPPORTED_FILE_EXTENSION',
      'Only .jpg, .jpeg, .png, and .webp images are allowed.'
    );
  }

  if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
    throw new AppError(
      400,
      'UNSUPPORTED_FILE_MIME',
      'Declared MIME type is not an allowed image format.'
    );
  }

  const detected = await fileTypeFromBuffer(file.buffer);
  const signatureMime = detected?.mime || detectMagicMime(file.buffer);

  if (!signatureMime || !ALLOWED_IMAGE_MIMES.includes(signatureMime)) {
    throw new AppError(
      400,
      'INVALID_FILE_SIGNATURE',
      'File content signature does not match a valid JPEG, PNG, or WebP image.'
    );
  }

  const safeFileName = `img-${crypto.randomUUID()}${ext}`;
  const imagekit = getImageKitClient();

  if (imagekit && typeof imagekit.upload === 'function') {
    const uploaded = await imagekit.upload({
      file: file.buffer.toString('base64'),
      fileName: safeFileName,
      folder: env.imagekitListingFolder,
      useUniqueFileName: true,
    });
    return {
      provider: 'imagekit',
      fileId: uploaded.fileId,
      url: uploaded.url,
      thumbnailUrl: uploaded.thumbnailUrl || uploaded.url,
      altText: path.basename(file.originalname, ext).slice(0, 120),
    };
  }

  const fileId = `local-img-${crypto.randomUUID()}`;
  const dataUri = `data:${signatureMime};base64,${file.buffer.toString('base64')}`;
  return {
    provider: 'local',
    fileId,
    url: dataUri,
    thumbnailUrl: dataUri,
    altText: path.basename(file.originalname, ext).slice(0, 120),
  };
}

export async function validateAndUploadResourceFile(file) {
  if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new AppError(400, 'EMPTY_FILE', 'Uploaded resource file is empty or missing.');
  }
  if (file.buffer.length > env.maxResourceSizeBytes) {
    throw new AppError(
      413,
      'FILE_TOO_LARGE',
      `Resource file exceeds the maximum size of ${env.maxResourceSizeMb} MB.`
    );
  }

  const ext = sanitizeExtension(file.originalname);
  if (!ALLOWED_RESOURCE_EXTENSIONS.includes(ext)) {
    throw new AppError(
      400,
      'UNSUPPORTED_FILE_EXTENSION',
      'Only PDF (.pdf) documents are allowed in the study resource library.'
    );
  }

  if (!ALLOWED_RESOURCE_MIMES.includes(file.mimetype)) {
    throw new AppError(
      400,
      'UNSUPPORTED_FILE_MIME',
      'Only application/pdf files are accepted.'
    );
  }

  const detected = await fileTypeFromBuffer(file.buffer);
  const signatureMime = detected?.mime || detectMagicMime(file.buffer);

  if (signatureMime !== 'application/pdf') {
    throw new AppError(
      400,
      'INVALID_FILE_SIGNATURE',
      'Uploaded file signature is not a valid PDF document.'
    );
  }

  const safeFileName = `res-${crypto.randomUUID()}.pdf`;
  const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');
  const imagekit = getImageKitClient();

  if (imagekit && typeof imagekit.upload === 'function') {
    const uploaded = await imagekit.upload({
      file: file.buffer.toString('base64'),
      fileName: safeFileName,
      folder: env.imagekitResourceFolder,
      isPrivateFile: true,
      useUniqueFileName: true,
    });
    return {
      provider: 'imagekit',
      fileId: uploaded.fileId,
      safeFileName,
      mimeType: 'application/pdf',
      byteSize: file.buffer.length,
      checksum,
    };
  }

  const fileId = `local-res-${crypto.randomUUID()}`;
  localPrivateResourceStore.set(fileId, Buffer.from(file.buffer));

  return {
    provider: 'local',
    fileId,
    safeFileName,
    mimeType: 'application/pdf',
    byteSize: file.buffer.length,
    checksum,
  };
}

export async function deleteStoredMedia(provider, fileId) {
  if (!fileId) return;
  try {
    if (provider === 'imagekit') {
      const imagekit = getImageKitClient();
      if (imagekit && typeof imagekit.deleteFile === 'function') {
        await imagekit.deleteFile(fileId);
      }
    } else {
      localPrivateResourceStore.delete(fileId);
    }
  } catch (err) {
    logger.warn({ event: 'orphan_media_cleanup_failed', provider, fileId, reason: err.message });
  }
}

export function getAuthorizedResourcePayload(resourceDoc) {
  const fileMeta = resourceDoc.file;
  if (fileMeta.provider === 'local') {
    const storedBuffer =
      localPrivateResourceStore.get(fileMeta.fileId) ||
      Buffer.from(
        `%PDF-1.4\n% CampusExchange Approved Study Resource: ${resourceDoc.resourceCode} - ${resourceDoc.title}\n1 0 obj << /Type /Catalog >> endobj\n%%EOF`,
        'utf8'
      );
    return {
      mode: 'buffer',
      buffer: storedBuffer,
      mimeType: fileMeta.mimeType || 'application/pdf',
      fileName: `${resourceDoc.resourceCode}-${fileMeta.safeFileName}`,
    };
  }

  const imagekit = getImageKitClient();
  if (imagekit && typeof imagekit.url === 'function') {
    const signedUrl = imagekit.url({
      path: `${env.imagekitResourceFolder}/${fileMeta.safeFileName}`,
      signed: true,
      expireSeconds: 120,
    });
    return {
      mode: 'signed_url',
      signedUrl,
      expiresInSeconds: 120,
      fileName: `${resourceDoc.resourceCode}-${fileMeta.safeFileName}`,
    };
  }

  const fallbackBuffer = Buffer.from(
    `%PDF-1.4\n% CampusExchange Resource ${resourceDoc.resourceCode}\n%%EOF`,
    'utf8'
  );
  return {
    mode: 'buffer',
    buffer: fallbackBuffer,
    mimeType: 'application/pdf',
    fileName: `${resourceDoc.resourceCode}-${fileMeta.safeFileName}`,
  };
}
