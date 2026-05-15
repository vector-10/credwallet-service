import { UserService } from '../../src/services/user.service';
import { UserRepository } from '../../src/repositories/user.repository';
import { WalletRepository } from '../../src/repositories/wallet.repository';
import { KarmaService } from '../../src/services/karma.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/repositories/wallet.repository');
jest.mock('../../src/services/karma.service');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../src/config/env', () => ({
  env: { JWT_SECRET: 'test-secret', JWT_EXPIRES_IN: '24h', ENCRYPTION_KEY: 'a'.repeat(64) },
}));
jest.mock('../../src/utils/encryption', () => ({
  encrypt: jest.fn((val: string) => `encrypted:${val}`),
}));

const mockUserRepo = jest.mocked(UserRepository).prototype;
const mockWalletRepo = jest.mocked(WalletRepository).prototype;
const mockKarmaService = jest.mocked(KarmaService).prototype;

const mockUser = {
  id: 'user-uuid-1',
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  phone_number: '08000000001',
  bvn: 'encrypted:12345678901',
  password_hash: 'hashed_password',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
};

const mockWallet = {
  id: 'wallet-uuid-1',
  user_id: 'user-uuid-1',
  account_number: '9100000001',
  balance: 0,
  minimum_balance: 100,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  describe('register', () => {
    it('should create a user and wallet when all inputs are valid', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.findByPhone.mockResolvedValue(null);
      mockKarmaService.isBlacklisted.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockUserRepo.create.mockResolvedValue(mockUser);
      mockWalletRepo.create.mockResolvedValue(mockWallet);

      const result = await userService.register({
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone_number: '08000000001',
        bvn: '12345678901',
        password: 'Password123!',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.wallet.account_number).toBe('9100000001');
      expect(result.user).not.toHaveProperty('password_hash');
      expect(result.user).not.toHaveProperty('bvn');
    });

    it('should throw 409 when email is already in use', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);

      await expect(
        userService.register({
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          phone_number: '08000000001',
          bvn: '12345678901',
          password: 'Password123!',
        })
      ).rejects.toMatchObject({ statusCode: 409, message: 'Email already in use' });
    });

    it('should throw 409 when phone number is already in use', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.findByPhone.mockResolvedValue(mockUser);

      await expect(
        userService.register({
          first_name: 'Test',
          last_name: 'User',
          email: 'new@example.com',
          phone_number: '08000000001',
          bvn: '12345678901',
          password: 'Password123!',
        })
      ).rejects.toMatchObject({ statusCode: 409, message: 'Phone number already in use' });
    });

    it('should throw 403 when user is on the karma blacklist', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.findByPhone.mockResolvedValue(null);
      mockKarmaService.isBlacklisted.mockResolvedValue(true);

      await expect(
        userService.register({
          first_name: 'Test',
          last_name: 'User',
          email: 'blacklisted@example.com',
          phone_number: '08000000001',
          bvn: '12345678901',
          password: 'Password123!',
        })
      ).rejects.toMatchObject({ statusCode: 403, message: 'Account creation denied' });
    });
  });

  describe('login', () => {
    it('should return a token and user when credentials are valid', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await userService.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('should throw 401 when email is not found', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(
        userService.login({ email: 'nobody@example.com', password: 'Password123!' })
      ).rejects.toMatchObject({ statusCode: 401, message: 'Invalid email or password' });
    });

    it('should throw 401 when password is wrong', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        userService.login({ email: 'test@example.com', password: 'WrongPassword!' })
      ).rejects.toMatchObject({ statusCode: 401, message: 'Invalid email or password' });
    });

    it('should throw 403 when account is deactivated', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({ ...mockUser, is_active: false });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        userService.login({ email: 'test@example.com', password: 'Password123!' })
      ).rejects.toMatchObject({ statusCode: 403, message: 'Account is deactivated' });
    });
  });
});
