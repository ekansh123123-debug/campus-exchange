import multer from 'multer';
import { env } from '../config/env.js';

const memoryStorage = multer.memoryStorage();

export const listingImageUpload = multer({
  storage: memoryStorage,
  limits: {
    files: env.maxListingImages,
    fileSize: env.maxImageSizeBytes,
    fieldSize: 100 * 1024,
  },
}).array('images', env.maxListingImages);

export const singleResourceUpload = multer({
  storage: memoryStorage,
  limits: {
    files: 1,
    fileSize: env.maxResourceSizeBytes,
    fieldSize: 100 * 1024,
  },
}).single('file');
