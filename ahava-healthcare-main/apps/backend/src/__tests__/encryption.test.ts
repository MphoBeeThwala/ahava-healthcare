import { encryptData, decryptData } from '../utils/encryption';

describe('Encryption Utilities', () => {
  const testData = 'Sensitive patient information';

  it('should encrypt data', () => {
    const encrypted = encryptData(testData);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(testData);
    expect(typeof encrypted).toBe('string');
  });

  it('should decrypt data correctly', () => {
    const encrypted = encryptData(testData);
    const decrypted = decryptData(encrypted);
    expect(decrypted).toBe(testData);
  });

  it('should produce different encrypted values for same input', () => {
    const encrypted1 = encryptData(testData);
    const encrypted2 = encryptData(testData);
    // Due to IV, encrypted values should be different
    expect(encrypted1).not.toBe(encrypted2);
    
    // But they should decrypt to the same value
    expect(decryptData(encrypted1)).toBe(decryptData(encrypted2));
  });

  it('should throw error on empty strings', () => {
    expect(() => encryptData('')).toThrow('Cannot encrypt empty data');
  });

  it('should handle long text', () => {
    const longText = 'A'.repeat(1000);
    const encrypted = encryptData(longText);
    const decrypted = decryptData(encrypted);
    expect(decrypted).toBe(longText);
  });

  it('should handle special characters', () => {
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    const encrypted = encryptData(specialChars);
    const decrypted = decryptData(encrypted);
    expect(decrypted).toBe(specialChars);
  });

  it('should handle unicode characters', () => {
    const unicode = '你好世界 🌍 مرحبا العالم';
    const encrypted = encryptData(unicode);
    const decrypted = decryptData(encrypted);
    expect(decrypted).toBe(unicode);
  });
});

