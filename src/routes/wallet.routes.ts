import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { idempotency } from '../middlewares/idempotency.middleware';
import { walletReadLimiter, walletWriteLimiter } from '../middlewares/rate-limit.middleware';
import { fundWalletSchema, transferSchema, withdrawSchema } from '../validators';

const router = Router();
const walletController = new WalletController();

router.use(authenticate);

router.get('/balance', walletReadLimiter, walletController.getBalance);
router.get('/transactions', walletReadLimiter, walletController.getTransactions);
router.post('/fund', walletWriteLimiter, idempotency, validate(fundWalletSchema), walletController.fund);
router.post('/transfer', walletWriteLimiter, idempotency, validate(transferSchema), walletController.transfer);
router.post('/withdraw', walletWriteLimiter, idempotency, validate(withdrawSchema), walletController.withdraw);

export default router;
