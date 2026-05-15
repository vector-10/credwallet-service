import { WalletService } from '../../src/services/wallet.service';
import { WalletRepository } from '../../src/repositories/wallet.repository';
import { TransactionRepository } from '../../src/repositories/transaction.repository';
import { LedgerRepository } from '../../src/repositories/ledger.repository';

jest.mock('../../src/repositories/wallet.repository');
jest.mock('../../src/repositories/transaction.repository');
jest.mock('../../src/repositories/ledger.repository');
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: { transaction: jest.fn((cb: any) => cb({})) },
}));

const mockWalletRepo = jest.mocked(WalletRepository).prototype;
const mockTxnRepo = jest.mocked(TransactionRepository).prototype;
const mockLedgerRepo = jest.mocked(LedgerRepository).prototype;

const mockWallet = {
  id: 'wallet-uuid-1',
  user_id: 'user-uuid-1',
  account_number: '9100000001',
  balance: 5000,
  minimum_balance: 100,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockTransaction = {
  id: 'txn-uuid-1',
  reference: 'TXN-ABC123',
  source_wallet_id: null,
  destination_wallet_id: 'wallet-uuid-1',
  amount: 1000,
  type: 'FUND' as const,
  status: 'PENDING' as const,
  description: 'Wallet funding',
  created_at: new Date(),
  updated_at: new Date(),
};

describe('WalletService', () => {
  let walletService: WalletService;

  beforeEach(() => {
    walletService = new WalletService();
  });

  describe('fund', () => {
    it('should return updated balance after funding', async () => {
      mockWalletRepo.findByUserIdWithLock.mockResolvedValue(mockWallet);
      mockTxnRepo.create.mockResolvedValue(mockTransaction);
      mockLedgerRepo.create.mockResolvedValue(undefined);
      mockTxnRepo.updateStatus.mockResolvedValue(undefined);

      const result = await walletService.fund('user-uuid-1', { amount: 1000 });

      expect(result.balance).toBe(6000);
    });

    it('should throw 404 when wallet is not found during lock acquisition', async () => {
      mockWalletRepo.findByUserIdWithLock.mockResolvedValue(null);

      await expect(
        walletService.fund('user-uuid-1', { amount: 1000 })
      ).rejects.toMatchObject({ statusCode: 404, message: 'Wallet not found' });
    });
  });

  describe('transfer', () => {
    const recipientWallet = {
      ...mockWallet,
      id: 'wallet-uuid-2',
      user_id: 'user-uuid-2',
      account_number: '9100000002',
      balance: 2000,
    };

    it('should return sender balance minus amount after a successful transfer', async () => {
      mockWalletRepo.findByUserId.mockResolvedValue(mockWallet);
      mockWalletRepo.findByAccountNumber.mockResolvedValue(recipientWallet);
      mockTxnRepo.create.mockResolvedValue({ ...mockTransaction, type: 'TRANSFER' as const });
      mockWalletRepo.findByIdWithLock
        .mockResolvedValueOnce(mockWallet)
        .mockResolvedValueOnce(recipientWallet);
      mockWalletRepo.adjustBalance.mockResolvedValue(undefined);
      mockLedgerRepo.create.mockResolvedValue(undefined);
      mockTxnRepo.updateStatus.mockResolvedValue(undefined);

      const result = await walletService.transfer('user-uuid-1', {
        recipient_account_number: '9100000002',
        amount: 500,
      });

      expect(result.balance).toBe(4500);
    });

    it('should throw 404 when recipient wallet does not exist', async () => {
      mockWalletRepo.findByUserId.mockResolvedValue(mockWallet);
      mockWalletRepo.findByAccountNumber.mockResolvedValue(null);

      await expect(
        walletService.transfer('user-uuid-1', {
          recipient_account_number: '9999999999',
          amount: 500,
        })
      ).rejects.toMatchObject({ statusCode: 404, message: 'Recipient wallet not found' });
    });

    it('should throw 400 when sender tries to transfer to their own wallet', async () => {
      mockWalletRepo.findByUserId.mockResolvedValue(mockWallet);
      mockWalletRepo.findByAccountNumber.mockResolvedValue(mockWallet);

      await expect(
        walletService.transfer('user-uuid-1', {
          recipient_account_number: '9100000001',
          amount: 500,
        })
      ).rejects.toMatchObject({ statusCode: 400, message: 'Cannot transfer to your own wallet' });
    });

    it('should correctly resolve sender and recipient when sender UUID sorts after recipient UUID', async () => {
      const senderWallet = { ...mockWallet, id: 'wallet-uuid-2', user_id: 'user-uuid-2', balance: 3000 };
      const recipientWallet2 = { ...mockWallet, id: 'wallet-uuid-1', account_number: '9100000001', balance: 1000 };

      mockWalletRepo.findByUserId.mockResolvedValue(senderWallet);
      mockWalletRepo.findByAccountNumber.mockResolvedValue(recipientWallet2);
      mockTxnRepo.create.mockResolvedValue({ ...mockTransaction, type: 'TRANSFER' as const });
      mockWalletRepo.findByIdWithLock
        .mockResolvedValueOnce(recipientWallet2)
        .mockResolvedValueOnce(senderWallet);
      mockWalletRepo.adjustBalance.mockResolvedValue(undefined);
      mockLedgerRepo.create.mockResolvedValue(undefined);
      mockTxnRepo.updateStatus.mockResolvedValue(undefined);

      const result = await walletService.transfer('user-uuid-2', {
        recipient_account_number: '9100000001',
        amount: 500,
      });

      expect(result.balance).toBe(2500);
    });

    it('should throw 400 when sender balance would fall below minimum balance', async () => {
      const nearEmptyWallet = { ...mockWallet, balance: 200 };
      mockWalletRepo.findByUserId.mockResolvedValue(nearEmptyWallet);
      mockWalletRepo.findByAccountNumber.mockResolvedValue(recipientWallet);
      mockTxnRepo.create.mockResolvedValue({ ...mockTransaction, type: 'TRANSFER' as const });
      mockWalletRepo.findByIdWithLock
        .mockResolvedValueOnce(nearEmptyWallet)
        .mockResolvedValueOnce(recipientWallet);

      await expect(
        walletService.transfer('user-uuid-1', {
          recipient_account_number: '9100000002',
          amount: 150,
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('withdraw', () => {
    it('should return updated balance after a successful withdrawal', async () => {
      mockWalletRepo.findByUserIdWithLock.mockResolvedValue(mockWallet);
      mockTxnRepo.create.mockResolvedValue({ ...mockTransaction, type: 'WITHDRAWAL' as const });
      mockWalletRepo.adjustBalance.mockResolvedValue(undefined);
      mockLedgerRepo.create.mockResolvedValue(undefined);
      mockTxnRepo.updateStatus.mockResolvedValue(undefined);

      const result = await walletService.withdraw('user-uuid-1', { amount: 1000 });

      expect(result.balance).toBe(4000);
    });

    it('should throw 400 when withdrawal would breach the minimum balance', async () => {
      const nearEmptyWallet = { ...mockWallet, balance: 200 };
      mockWalletRepo.findByUserIdWithLock.mockResolvedValue(nearEmptyWallet);

      await expect(
        walletService.withdraw('user-uuid-1', { amount: 150 })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw 404 when wallet is not found during lock acquisition', async () => {
      mockWalletRepo.findByUserIdWithLock.mockResolvedValue(null);

      await expect(
        walletService.withdraw('user-uuid-1', { amount: 500 })
      ).rejects.toMatchObject({ statusCode: 404, message: 'Wallet not found' });
    });
  });

  describe('getBalance', () => {
    it('should return balance, minimum_balance and account_number', async () => {
      mockWalletRepo.findByUserId.mockResolvedValue(mockWallet);

      const result = await walletService.getBalance('user-uuid-1');

      expect(result.balance).toBe(5000);
      expect(result.minimum_balance).toBe(100);
      expect(result.account_number).toBe('9100000001');
    });

    it('should throw 404 when wallet is not found', async () => {
      mockWalletRepo.findByUserId.mockResolvedValue(null);

      await expect(
        walletService.getBalance('user-uuid-1')
      ).rejects.toMatchObject({ statusCode: 404, message: 'Wallet not found' });
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions with metadata', async () => {
      mockWalletRepo.findByUserId.mockResolvedValue(mockWallet);
      mockTxnRepo.findByWalletId.mockResolvedValue({ data: [mockTransaction], total: 1 });

      const result = await walletService.getTransactions('user-uuid-1', 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].reference).toBe('TXN-ABC123');
      expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1, pages: 1 });
    });

    it('should calculate pages correctly for multi-page results', async () => {
      mockWalletRepo.findByUserId.mockResolvedValue(mockWallet);
      mockTxnRepo.findByWalletId.mockResolvedValue({ data: [], total: 45 });

      const result = await walletService.getTransactions('user-uuid-1', 1, 20);

      expect(result.pagination.pages).toBe(3);
      expect(result.pagination.total).toBe(45);
    });

    it('should throw 404 when wallet is not found', async () => {
      mockWalletRepo.findByUserId.mockResolvedValue(null);

      await expect(
        walletService.getTransactions('user-uuid-1', 1, 20)
      ).rejects.toMatchObject({ statusCode: 404, message: 'Wallet not found' });
    });
  });
});
