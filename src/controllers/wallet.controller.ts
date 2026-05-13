import { Request, Response } from 'express';
import { WalletService } from '../services/wallet.service';

export class WalletController {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  fund = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.walletService.fund(req.user!.userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Wallet funded successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  transfer = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.walletService.transfer(req.user!.userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Transfer successful',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  withdraw = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.walletService.withdraw(req.user!.userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Withdrawal successful',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.walletService.getBalance(req.user!.userId);
      res.status(200).json({
        success: true,
        message: 'Balance retrieved successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.walletService.getTransactions(req.user!.userId);
      res.status(200).json({
        success: true,
        message: 'Transactions retrieved successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}
