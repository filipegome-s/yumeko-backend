import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters!';
});

const { encrypt, decrypt } = await import('../../src/infrastructure/crypto/index');

describe('crypto', () => {
  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const originalText = 'my-secret-token';

      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it('should produce different ciphertexts for same plaintext (due to random IV)', () => {
      const text = 'same-text';

      const encrypted1 = encrypt(text);
      const encrypted2 = encrypt(text);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should include IV, auth tag, and ciphertext in encrypted output', () => {
      const text = 'test-text';

      const encrypted = encrypt(text);
      const parts = encrypted.split(':');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toHaveLength(32);
      expect(parts[1]).toHaveLength(32);
      expect(parts[2].length).toBeGreaterThan(0);
    });

    it('should throw error for invalid encrypted text format', () => {
      expect(() => decrypt('invalid-text')).toThrow('Invalid encrypted text format');
    });

    it('should handle special characters', () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      const encrypted = encrypt(specialText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(specialText);
    });

    it('should handle empty string', () => {
      const text = '';

      const encrypted = encrypt(text);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(text);
    });

    it('should handle long strings', () => {
      const longText = 'a'.repeat(10000);

      const encrypted = encrypt(longText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(longText);
    });
  });
});
