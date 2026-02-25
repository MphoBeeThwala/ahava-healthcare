import { hashSensitiveData, generateChecksum, generateEncryptionKey, generateIVSalt } from '../utils/encryption';

describe('Encryption utilities', () => {
  describe('hashSensitiveData', () => {
    it('should return a SHA-256 hex hash', () => {
      const hash = hashSensitiveData('test-data');
      expect(hash).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });

    it('should return consistent hashes for the same input', () => {
      const hash1 = hashSensitiveData('same-input');
      const hash2 = hashSensitiveData('same-input');
      expect(hash1).toBe(hash2);
    });

    it('should return different hashes for different inputs', () => {
      const hash1 = hashSensitiveData('input-a');
      const hash2 = hashSensitiveData('input-b');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateChecksum', () => {
    it('should generate checksum for a string', () => {
      const checksum = generateChecksum('hello world');
      expect(checksum).toHaveLength(64);
    });

    it('should generate checksum for an object', () => {
      const checksum = generateChecksum({ key: 'value', num: 42 });
      expect(checksum).toHaveLength(64);
    });

    it('should return consistent checksums for the same object', () => {
      const obj = { a: 1, b: 2 };
      const c1 = generateChecksum(obj);
      const c2 = generateChecksum(obj);
      expect(c1).toBe(c2);
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a base64-encoded key', () => {
      const key = generateEncryptionKey();
      expect(typeof key).toBe('string');
      const decoded = Buffer.from(key, 'base64');
      expect(decoded.length).toBe(32);
    });

    it('should generate unique keys', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('generateIVSalt', () => {
    it('should generate a hex-encoded IV salt', () => {
      const salt = generateIVSalt();
      expect(typeof salt).toBe('string');
      expect(salt).toHaveLength(32);
      expect(/^[a-f0-9]+$/.test(salt)).toBe(true);
    });

    it('should generate unique salts', () => {
      const salt1 = generateIVSalt();
      const salt2 = generateIVSalt();
      expect(salt1).not.toBe(salt2);
    });
  });
});
