import db from "../config/database";
import { WalletRepository } from "../repositories/wallet.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { LedgerRepository } from "../repositories/ledger.repository";
import {
  FundWalletPayload,
  TransferPayload,
  Wallet,
  WithdrawPayload,
} from "../types";
import { generateTransactionReference } from "../utils/helpers";
import { AppError } from "../utils/errors";
import logger from "../utils/logger";

export class WalletService {
  private walletRepository: WalletRepository;
  private transactionRepository: TransactionRepository;
  private ledgerRepository: LedgerRepository;

  constructor() {
    this.walletRepository = new WalletRepository();
    this.transactionRepository = new TransactionRepository();
    this.ledgerRepository = new LedgerRepository();
  }

  private async getWalletOrThrow(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) throw new AppError(404, "Wallet not found");
    return wallet;
  }

  private assertSufficientBalance(
    balance: number,
    amount: number,
    minimum: number,
  ): void {
    if (Math.round((balance - amount) * 100) / 100 < minimum) {
      throw new AppError(
        400,
        `Insufficient balance. Minimum balance of ₦${minimum} must be maintained`,
      );
    }
  }

  async fund(userId: string, payload: FundWalletPayload) {
    return db.transaction(async (trx) => {
      const lockedWallet = await this.walletRepository.findByUserIdWithLock(userId, trx);
      if (!lockedWallet) {
        logger.error('Fund failed — wallet not found', { userId });
        throw new AppError(404, "Wallet not found");
      }

      const balanceBefore = Number(lockedWallet.balance);
      const balanceAfter = Math.round((balanceBefore + payload.amount) * 100) / 100;

      const transaction = await this.transactionRepository.create(
        {
          reference: generateTransactionReference(),
          source_wallet_id: null,
          destination_wallet_id: lockedWallet.id,
          amount: payload.amount,
          type: "FUND",
          status: "PENDING",
          description: "Wallet funding",
        },
        trx,
      );

      await this.walletRepository.adjustBalance(lockedWallet.id, payload.amount, trx);

      await this.ledgerRepository.create(
        {
          wallet_id: null,
          transaction_id: transaction.id,
          entry_type: "DEBIT",
          amount: payload.amount,
          balance_before: null,
          balance_after: null,
        },
        trx,
      );
      await this.ledgerRepository.create(
        {
          wallet_id: lockedWallet.id,
          transaction_id: transaction.id,
          entry_type: "CREDIT",
          amount: payload.amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
        },
        trx,
      );

      await this.transactionRepository.updateStatus(transaction.id, "SUCCESS", trx);

      logger.info('Wallet funded', { userId, walletId: lockedWallet.id });
      return { balance: balanceAfter };
    });
  }

  async transfer(userId: string, payload: TransferPayload) {
    return db.transaction(async (trx) => {
      const senderWallet = await this.walletRepository.findByUserId(userId, trx);
      if (!senderWallet) {
        logger.error('Transfer failed — sender wallet not found', { userId });
        throw new AppError(404, "Wallet not found");
      }

      const recipientWallet = await this.walletRepository.findByAccountNumber(
        payload.recipient_account_number,
        trx,
      );
      if (!recipientWallet) {
        logger.warn('Transfer failed — recipient wallet not found', { userId, recipientAccount: payload.recipient_account_number });
        throw new AppError(404, "Recipient wallet not found");
      }

      if (senderWallet.id === recipientWallet.id) {
        logger.warn('Transfer failed — self-transfer attempt', { userId, walletId: senderWallet.id });
        throw new AppError(400, "Cannot transfer to your own wallet");
      }

      const [firstId, secondId] = [senderWallet.id, recipientWallet.id].sort();
      const lockedFirst = await this.walletRepository.findByIdWithLock(firstId, trx);
      const lockedSecond = await this.walletRepository.findByIdWithLock(secondId, trx);

      if (!lockedFirst || !lockedSecond) {
        logger.error('Transfer failed — wallet lock acquisition failed', { userId, senderWalletId: senderWallet.id, recipientWalletId: recipientWallet.id });
        throw new AppError(404, "Wallet not found or deactivated");
      }

      const lockedSender =
        lockedFirst.id === senderWallet.id ? lockedFirst : lockedSecond;
      const lockedRecipient =
        lockedFirst.id === recipientWallet.id ? lockedFirst : lockedSecond;

      const senderBalanceBefore = Number(lockedSender.balance);
      const recipientBalanceBefore = Number(lockedRecipient.balance);
      const senderBalanceAfter = Math.round((senderBalanceBefore - payload.amount) * 100) / 100;
      const recipientBalanceAfter = Math.round((recipientBalanceBefore + payload.amount) * 100) / 100;

      try {
        this.assertSufficientBalance(senderBalanceBefore, payload.amount, Number(lockedSender.minimum_balance));
      } catch (err) {
        logger.warn('Transfer failed — insufficient balance', { userId, walletId: senderWallet.id });
        throw err;
      }

      const transaction = await this.transactionRepository.create(
        {
          reference: generateTransactionReference(),
          source_wallet_id: senderWallet.id,
          destination_wallet_id: recipientWallet.id,
          amount: payload.amount,
          type: "TRANSFER",
          status: "PENDING",
          description: payload.description ?? "Wallet transfer",
        },
        trx,
      );

      await this.walletRepository.adjustBalance(senderWallet.id, -payload.amount, trx);
      await this.walletRepository.adjustBalance(recipientWallet.id, payload.amount, trx);

      await this.ledgerRepository.create(
        {
          wallet_id: senderWallet.id,
          transaction_id: transaction.id,
          entry_type: "DEBIT",
          amount: payload.amount,
          balance_before: senderBalanceBefore,
          balance_after: senderBalanceAfter,
        },
        trx,
      );
      await this.ledgerRepository.create(
        {
          wallet_id: recipientWallet.id,
          transaction_id: transaction.id,
          entry_type: "CREDIT",
          amount: payload.amount,
          balance_before: recipientBalanceBefore,
          balance_after: recipientBalanceAfter,
        },
        trx,
      );

      await this.transactionRepository.updateStatus(transaction.id, "SUCCESS", trx);

      logger.info('Transfer completed', { senderId: userId, senderWalletId: senderWallet.id, recipientWalletId: recipientWallet.id });
      return { balance: senderBalanceAfter };
    });
  }

  async withdraw(userId: string, payload: WithdrawPayload) {
    return db.transaction(async (trx) => {
      const lockedWallet = await this.walletRepository.findByUserIdWithLock(userId, trx);
      if (!lockedWallet) {
        logger.error('Withdrawal failed — wallet not found', { userId });
        throw new AppError(404, "Wallet not found");
      }

      const balanceBefore = Number(lockedWallet.balance);
      const balanceAfter = Math.round((balanceBefore - payload.amount) * 100) / 100;

      try {
        this.assertSufficientBalance(balanceBefore, payload.amount, Number(lockedWallet.minimum_balance));
      } catch (err) {
        logger.warn('Withdrawal failed — insufficient balance', { userId, walletId: lockedWallet.id });
        throw err;
      }

      const transaction = await this.transactionRepository.create(
        {
          reference: generateTransactionReference(),
          source_wallet_id: lockedWallet.id,
          destination_wallet_id: null,
          amount: payload.amount,
          type: "WITHDRAWAL",
          status: "PENDING",
          description: payload.description ?? "Wallet withdrawal",
        },
        trx,
      );

      await this.walletRepository.adjustBalance(lockedWallet.id, -payload.amount, trx);

      await this.ledgerRepository.create(
        {
          wallet_id: lockedWallet.id,
          transaction_id: transaction.id,
          entry_type: "DEBIT",
          amount: payload.amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
        },
        trx,
      );
      await this.ledgerRepository.create(
        {
          wallet_id: null,
          transaction_id: transaction.id,
          entry_type: "CREDIT",
          amount: payload.amount,
          balance_before: null,
          balance_after: null,
        },
        trx,
      );

      await this.transactionRepository.updateStatus(transaction.id, "SUCCESS", trx);

      logger.info('Withdrawal completed', { userId, walletId: lockedWallet.id });
      return { balance: balanceAfter };
    });
  }

  async getBalance(userId: string) {
    const wallet = await this.getWalletOrThrow(userId);
    return {
      balance: Number(wallet.balance),
      minimum_balance: Number(wallet.minimum_balance),
      account_number: wallet.account_number,
    };
  }

  async getTransactions(userId: string, page: number, limit: number) {
    const wallet = await this.getWalletOrThrow(userId);
    const offset = (page - 1) * limit;
    const { data, total } = await this.transactionRepository.findByWalletId(wallet.id, limit, offset);
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
