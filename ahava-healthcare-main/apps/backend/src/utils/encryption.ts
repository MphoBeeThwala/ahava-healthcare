import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const keyLength = 32;
const ivLength = 16;
const authTagLength = 16;

/**
 * Generate a new encryption key (32 bytes for AES-256)
 * @returns Base64-encoded encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(keyLength).toString('base64');
}

/**
 * Generate a new IV salt (16 bytes)
 * @returns Hex-encoded IV salt
 */
export function generateIVSalt(): string {
  return crypto.randomBytes(ivLength).toString('hex');
}

/**
 * Encrypt data using AES-256-GCM
 * @param plaintext - The data to encrypt
 * @param key - Base64-encoded encryption key (optional, uses env var if not provided)
 * @returns Encrypted data in format: iv:authTag:encryptedData (all hex-encoded)
 */
export function encryptData(plaintext: string, key?: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty data');
  }

  const encryptionKey = key 
    ? Buffer.from(key, 'base64')
    : Buffer.from(process.env.ENCRYPTION_KEY || '', 'base64');

  if (encryptionKey.length !== keyLength) {
    throw new Error('Invalid encryption key length. Expected 32 bytes.');
  }

  // Generate a random IV for each encryption operation
  const iv = crypto.randomBytes(ivLength);
  
  // Create cipher with proper API (createCipheriv)
  const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV, authTag, and encrypted data
  const combined = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  
  return combined;
}

/**
 * Decrypt data encrypted with AES-256-GCM
 * @param encryptedData - Encrypted data in format: iv:authTag:encryptedData
 * @param key - Base64-encoded encryption key (optional, uses env var if not provided)
 * @returns Decrypted plaintext
 */
export function decryptData(encryptedData: string, key?: string): string {
  if (!encryptedData) {
    throw new Error('Cannot decrypt empty data');
  }

  const encryptionKey = key
    ? Buffer.from(key, 'base64')
    : Buffer.from(process.env.ENCRYPTION_KEY || '', 'base64');

  if (encryptionKey.length !== keyLength) {
    throw new Error('Invalid encryption key length. Expected 32 bytes.');
  }
  
  // Split the combined data
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format. Expected format: iv:authTag:encryptedData');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  // Validate IV and authTag lengths
  if (iv.length !== ivLength) {
    throw new Error('Invalid IV length');
  }
  if (authTag.length !== authTagLength) {
    throw new Error('Invalid auth tag length');
  }
  
  // Create decipher with proper API (createDecipheriv)
  const decipher = crypto.createDecipheriv(algorithm, encryptionKey, iv);
  decipher.setAuthTag(authTag);
  
  try {
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed. Data may be corrupted or tampered with.');
  }
}

/**
 * Hash sensitive data using SHA-256 with salt
 * @param data - Data to hash
 * @param salt - Optional salt (generates random if not provided)
 * @returns Hex-encoded hash
 */
export function hashSensitiveData(data: string, salt?: string): string {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex');
  return crypto.createHash('sha256').update(data + usedSalt).digest('hex');
}

/**
 * Generate checksum for data integrity verification
 * @param data - Data to checksum
 * @returns Hex-encoded SHA-256 checksum
 */
export function generateChecksum(data: any): string {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

/**
 * Validate and sanitize encrypted data before storage
 * @param encryptedData - Encrypted data to validate
 * @returns Boolean indicating if data is valid
 */
export function isValidEncryptedData(encryptedData: string): boolean {
  if (!encryptedData || typeof encryptedData !== 'string') {
    return false;
  }
  
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    return false;
  }
  
  // Check if all parts are valid hex strings
  const hexRegex = /^[0-9a-f]+$/i;
  return parts.every(part => hexRegex.test(part));
}
