import { hashPassword, verifyPassword } from '../utils/password';

describe('Password Utility', () => {
  const plainPassword = 'mySuperSecretPassword123!';

  describe('hashPassword', () => {
    it('should hash the password', async () => {
      const hash = await hashPassword(plainPassword);
      expect(hash).not.toBe(plainPassword);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      // Verify bcrypt format $2b$ or similar
      expect(hash).toMatch(/^\$2[abxy]\$\d+\$.{53}$/);
    });

    it('should generate different hashes for the same password', async () => {
      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const hash = await hashPassword(plainPassword);
      const isValid = await verifyPassword(plainPassword, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await hashPassword(plainPassword);
      const isValid = await verifyPassword('wrongpassword', hash);
      expect(isValid).toBe(false);
    });
  });
});
