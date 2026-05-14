import db from '../config/database';
import { WalletRepository } from '../repositories/wallet.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { FundWalletPayload, TransferPayload, WithdrawPayload } from '../types';
import { generateTransactionReference } from '../utils/helpers';

export class WalletService {
  private walletRepository: WalletRepository;
  private transactionRepository: TransactionRepository;

  constructor() {
    this.walletRepository = new WalletRepository();
    this.transactionRepository = new TransactionRepository();
  }

  async fund(userId: string, payload: FundWalletPayload) {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) throw new Error('Wallet not found');

    const newBalance = Number(wallet.balance) + Number(payload.amount);

    await db.transaction(async (trx) => {
      await this.walletRepository.updateBalance(wallet.id, newBalance, trx);
      await this.transactionRepository.create(
        {
          reference: generateTransactionReference(),
          source_wallet_id: null,
          destination_wallet_id: wallet.id,
          amount: payload.amount,
          type: 'FUND',
          status: 'SUCCESS',
          description: 'Wallet funding',
        },
        trx
      );
    });

    return { balance: newBalance };
  }

  async transfer(userId: string, payload: TransferPayload) {
    const senderWallet = await this.walletRepository.findByUserId(userId);
    if (!senderWallet) throw new Error('Sender wallet not found');

    const recipientWallet = await this.walletRepository.findByAccountNumber(
      payload.recipient_account_number
    );
    if (!recipientWallet) throw new Error('Recipient wallet not found');

    if (senderWallet.id === recipientWallet.id) {
      throw new Error('Cannot transfer to your own wallet');
    }

    const senderBalance = Number(senderWallet.balance);
    const minimumBalance = Number(senderWallet.minimum_balance);

    if (senderBalance - payload.amount < minimumBalance) {
      throw new Error(
        `Insufficient balance. Minimum balance of ₦${minimumBalance} must be maintained`
      );
    }

    const newSenderBalance = senderBalance - Number(payload.amount);
    const newRecipientBalance =
      Number(recipientWallet.balance) + Number(payload.amount);

    await db.transaction(async (trx) => {
      await this.walletRepository.updateBalance(senderWallet.id, newSenderBalance, trx);
      await this.walletRepository.updateBalance(recipientWallet.id, newRecipientBalance, trx);
      await this.transactionRepository.create(
        {
          reference: generateTransactionReference(),
          source_wallet_id: senderWallet.id,
          destination_wallet_id: recipientWallet.id,
          amount: payload.amount,
          type: 'TRANSFER',
          status: 'SUCCESS',
          description: payload.description ?? 'Wallet transfer',
        },
        trx
      );
    });

    return { balance: newSenderBalance };
  }

  async withdraw(userId: string, payload: WithdrawPayload) {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) throw new Error('Wallet not found');

    const currentBalance = Number(wallet.balance);
    const minimumBalance = Number(wallet.minimum_balance);

    if (currentBalance - payload.amount < minimumBalance) {
      throw new Error(
        `Insufficient balance. Minimum balance of ₦${minimumBalance} must be maintained`
      );
    }

    const newBalance = currentBalance - Number(payload.amount);

    await db.transaction(async (trx) => {
      await this.walletRepository.updateBalance(wallet.id, newBalance, trx);
      await this.transactionRepository.create(
        {
          reference: generateTransactionReference(),
          source_wallet_id: wallet.id,
          destination_wallet_id: null,
          amount: payload.amount,
          type: 'WITHDRAWAL',
          status: 'SUCCESS',
          description: payload.description ?? 'Wallet withdrawal',
        },
        trx
      );
    });

    return { balance: newBalance };
  }

  async getBalance(userId: string) {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) throw new Error('Wallet not found');

    return {
      balance: Number(wallet.balance),
      minimum_balance: Number(wallet.minimum_balance),
      account_number: wallet.account_number,
    };
  }

  async getTransactions(userId: string) {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) throw new Error('Wallet not found');

    return this.transactionRepository.findByWalletId(wallet.id);
  }
}
