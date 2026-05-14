import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { idempotency } from '../middlewares/idempotency.middleware';
import { fundWalletSchema, transferSchema, withdrawSchema } from '../validators';

const router = Router();
const walletController = new WalletController();

router.use(authenticate);

router.get('/balance', walletController.getBalance);
router.get('/transactions', walletController.getTransactions);
router.post('/fund', idempotency, validate(fundWalletSchema), walletController.fund);
router.post('/transfer', idempotency, validate(transferSchema), walletController.transfer);
router.post('/withdraw', idempotency, validate(withdrawSchema), walletController.withdraw);

export default router;
