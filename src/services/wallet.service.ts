import db from "../config/database";
import { WalletRepository } from "../repositories/wallet.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import {
  FundWalletPayload,
  TransferPayload,
  Wallet,
  WithdrawPayload,
} from "../types";
import { generateTransactionReference } from "../utils/helpers";
import { AppError } from "../utils/errors";

export class WalletService {
  private walletRepository: WalletRepository;
  private transactionRepository: TransactionRepository;

  constructor() {
    this.walletRepository = new WalletRepository();
    this.transactionRepository = new TransactionRepository();
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
    if (balance - amount < minimum) {
      throw new AppError(
        400,
        `Insufficient balance. Minimum balance of ₦${minimum} must be maintained`,
      );
    }
  }

  async fund(userId: string, payload: FundWalletPayload) {
    return db.transaction(async (trx) => {
      const wallet = await this.getWalletOrThrow(userId);

      await this.walletRepository.adjustBalance(wallet.id, payload.amount, trx);

      await this.transactionRepository.create(
        {
          reference: generateTransactionReference(),
          source_wallet_id: null,
          destination_wallet_id: wallet.id,
          amount: payload.amount,
          type: "FUND",
          status: "SUCCESS",
          description: "Wallet funding",
        },
        trx,
      );

      const updated = await this.walletRepository.findByIdInTransaction(
        wallet.id,
        trx,
      );
      return { balance: Number(updated!.balance) };
    });
  }

  async transfer(userId: string, payload: TransferPayload) {
    return db.transaction(async (trx) => {
      const senderWallet = await this.getWalletOrThrow(userId);

      const recipientWallet = await this.walletRepository.findByAccountNumber(
        payload.recipient_account_number,
      );
      if (!recipientWallet)
        throw new AppError(404, "Recipient wallet not found");

      if (senderWallet.id === recipientWallet.id) {
        throw new AppError(400, "Cannot transfer to your own wallet");
      }

      const [firstId, secondId] = [senderWallet.id, recipientWallet.id].sort();
      const lockedFirst = await this.walletRepository.findByIdWithLock(
        firstId,
        trx,
      );
      const lockedSecond = await this.walletRepository.findByIdWithLock(
        secondId,
        trx,
      );

      const lockedSender =
        lockedFirst!.id === senderWallet.id ? lockedFirst! : lockedSecond!;
      const senderBalance = Number(lockedSender.balance);

      this.assertSufficientBalance(
        senderBalance,
        payload.amount,
        Number(lockedSender.minimum_balance),
      );

      await this.walletRepository.adjustBalance(
        senderWallet.id,
        -payload.amount,
        trx,
      );
      await this.walletRepository.adjustBalance(
        recipientWallet.id,
        payload.amount,
        trx,
      );

      await this.transactionRepository.create(
        {
          reference: generateTransactionReference(),
          source_wallet_id: senderWallet.id,
          destination_wallet_id: recipientWallet.id,
          amount: payload.amount,
          type: "TRANSFER",
          status: "SUCCESS",
          description: payload.description ?? "Wallet transfer",
        },
        trx,
      );

      return { balance: senderBalance - payload.amount };
    });
  }

  async withdraw(userId: string, payload: WithdrawPayload) {
    return db.transaction(async (trx) => {
      const wallet = await this.getWalletOrThrow(userId);

      const lockedWallet = await this.walletRepository.findByIdWithLock(
        wallet.id,
        trx,
      );
      if (!lockedWallet) throw new AppError(404, "Wallet not found");

      const currentBalance = Number(lockedWallet.balance);

      this.assertSufficientBalance(
        currentBalance,
        payload.amount,
        Number(lockedWallet.minimum_balance),
      );

      await this.walletRepository.adjustBalance(
        wallet.id,
        -payload.amount,
        trx,
      );

      await this.transactionRepository.create(
        {
          reference: generateTransactionReference(),
          source_wallet_id: wallet.id,
          destination_wallet_id: null,
          amount: payload.amount,
          type: "WITHDRAWAL",
          status: "SUCCESS",
          description: payload.description ?? "Wallet withdrawal",
        },
        trx,
      );

      return { balance: currentBalance - payload.amount };
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

  async getTransactions(userId: string) {
    const wallet = await this.getWalletOrThrow(userId);
    return this.transactionRepository.findByWalletId(wallet.id);
  }
}
