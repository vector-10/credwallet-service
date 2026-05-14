import { Request, Response } from 'express';
import { WalletService } from '../services/wallet.service';
import { asyncHandler } from '../utils/asyncHandler';

export class WalletController {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  fund = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.walletService.fund(req.user!.userId, req.body);
    res.status(200).json({ success: true, message: 'Wallet funded successfully', data: result });
  });

  transfer = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.walletService.transfer(req.user!.userId, req.body);
    res.status(200).json({ success: true, message: 'Transfer successful', data: result });
  });

  withdraw = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.walletService.withdraw(req.user!.userId, req.body);
    res.status(200).json({ success: true, message: 'Withdrawal successful', data: result });
  });

  getBalance = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.walletService.getBalance(req.user!.userId);
    res.status(200).json({ success: true, message: 'Balance retrieved successfully', data: result });
  });

  getTransactions = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.walletService.getTransactions(req.user!.userId);
    res.status(200).json({ success: true, message: 'Transactions retrieved successfully', data: result });
  });
}
