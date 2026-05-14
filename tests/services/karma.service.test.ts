import { KarmaService } from '../../src/services/karma.service';
import { AppError } from '../../src/utils/errors';

jest.mock('../../src/config/env', () => ({
  env: {
    ADJUTOR_BASE_URL: 'https://adjutor.lendsqr.com/v2',
    ADJUTOR_API_KEY: 'test-api-key',
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('KarmaService', () => {
  let karmaService: KarmaService;

  beforeEach(() => {
    karmaService = new KarmaService();
  });

  describe('isBlacklisted', () => {
    it('should return false when user is clean', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({}),
      });

      const result = await karmaService.isBlacklisted('clean@test.com', '08000000000');

      expect(result).toBe(false);
    });

    it('should return true when user is blacklisted', async () => {
      mockFetch.mockResolvedValue({
        json: async () => ({ status: 'success', data: { karma_identity: 'bad@test.com' } }),
      });

      const result = await karmaService.isBlacklisted('bad@test.com', '08000000000');

      expect(result).toBe(true);
    });

    it('should throw AppError 503 when the karma API is unreachable', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        karmaService.isBlacklisted('any@test.com', '08000000000')
      ).rejects.toThrow(AppError);

      await expect(
        karmaService.isBlacklisted('any@test.com', '08000000000')
      ).rejects.toMatchObject({ statusCode: 503 });
    });
  });
});
