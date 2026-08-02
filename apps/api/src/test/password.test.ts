import bcrypt from 'bcrypt';
import { verifyPassword } from '../utils/password';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('password utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyPassword', () => {
    it('should return true when passwords match', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await verifyPassword('plainPassword', 'hashedPassword');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('plainPassword', 'hashedPassword');
    });

    it('should return false when passwords do not match', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await verifyPassword('wrongPassword', 'hashedPassword');

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedPassword');
    });

    it('should handle errors from bcrypt', async () => {
      const error = new Error('bcrypt error');
      (bcrypt.compare as jest.Mock).mockRejectedValue(error);

      await expect(verifyPassword('plainPassword', 'hashedPassword')).rejects.toThrow('bcrypt error');
    });
  });
});
