import multer from 'multer';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import crypto from 'crypto';
import { Request } from 'express';
import logger from '../utils/logger';

// Upload directories
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const TEMP_DIR = path.join(UPLOAD_DIR, 'temp');
const FILES_DIR = path.join(UPLOAD_DIR, 'files');
const IMAGES_DIR = path.join(UPLOAD_DIR, 'images');
const DOCUMENTS_DIR = path.join(UPLOAD_DIR, 'documents');

// Create upload directories if they don't exist
[UPLOAD_DIR, TEMP_DIR, FILES_DIR, IMAGES_DIR, DOCUMENTS_DIR].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

// File type configurations
const FILE_TYPES = {
  images: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  documents: {
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    extensions: ['.pdf', '.doc', '.docx'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  files: {
    mimeTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv',
    ],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt', '.csv'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
};

/**
 * Generate unique filename
 */
function generateFilename(originalname: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalname);
  return `${timestamp}-${randomString}${extension}`;
}

/**
 * File filter function
 */
function createFileFilter(allowedTypes: string[]) {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const isValidType = allowedTypes.includes(file.mimetype);
    const extension = path.extname(file.originalname).toLowerCase();
    
    if (!isValidType) {
      logger.security('File upload rejected - invalid type', {
        userId: (req as any).user?.id,
        filename: file.originalname,
        mimetype: file.mimetype,
      });
      return cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }

    cb(null, true);
  };
}

/**
 * Storage configuration
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine destination based on file type
    let destination = FILES_DIR;
    
    if (file.mimetype.startsWith('image/')) {
      destination = IMAGES_DIR;
    } else if (file.mimetype === 'application/pdf' || 
               file.mimetype.includes('word')) {
      destination = DOCUMENTS_DIR;
    }

    cb(null, destination);
  },
  filename: (req, file, cb) => {
    const filename = generateFilename(file.originalname);
    cb(null, filename);
  },
});

/**
 * Image upload middleware
 * Accepts: JPEG, PNG, GIF, WebP
 * Max size: 5MB
 */
export const uploadImage = multer({
  storage,
  limits: {
    fileSize: FILE_TYPES.images.maxSize,
    files: 1,
  },
  fileFilter: createFileFilter(FILE_TYPES.images.mimeTypes),
});

/**
 * Document upload middleware
 * Accepts: PDF, DOC, DOCX
 * Max size: 10MB
 */
export const uploadDocument = multer({
  storage,
  limits: {
    fileSize: FILE_TYPES.documents.maxSize,
    files: 1,
  },
  fileFilter: createFileFilter(FILE_TYPES.documents.mimeTypes),
});

/**
 * General file upload middleware
 * Accepts: Images, Documents, Text files
 * Max size: 10MB
 */
export const uploadFile = multer({
  storage,
  limits: {
    fileSize: FILE_TYPES.files.maxSize,
    files: 1,
  },
  fileFilter: createFileFilter(FILE_TYPES.files.mimeTypes),
});

/**
 * Multiple files upload (max 5 files)
 */
export const uploadMultipleFiles = multer({
  storage,
  limits: {
    fileSize: FILE_TYPES.files.maxSize,
    files: 5,
  },
  fileFilter: createFileFilter(FILE_TYPES.files.mimeTypes),
});

/**
 * Middleware to handle multer errors
 */
export const handleUploadError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    logger.error('File upload error', {
      error: err.message,
      code: err.code,
      field: err.field,
      userId: req.user?.id,
    });

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 10MB.',
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files. Maximum is 5 files.',
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected file field.',
      });
    }

    return res.status(400).json({
      error: `File upload error: ${err.message}`,
    });
  }

  if (err) {
    logger.error('Upload middleware error', err);
    return res.status(400).json({
      error: err.message || 'File upload failed',
    });
  }

  next();
};

/**
 * Get file URL for serving
 */
export function getFileUrl(filename: string, type: 'image' | 'document' | 'file' = 'file'): string {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
  return `${baseUrl}/uploads/${type}s/${filename}`;
}

/**
 * Validate file exists and user has permission
 */
export async function validateFileAccess(filename: string, userId: string): Promise<boolean> {
  // Check if file exists in database (if tracked)
  // Check if user has permission to access it
  // For now, return true (implement based on your requirements)
  return true;
}

export {
  UPLOAD_DIR,
  TEMP_DIR,
  FILES_DIR,
  IMAGES_DIR,
  DOCUMENTS_DIR,
};


