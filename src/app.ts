import express from 'express';
import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'CredWallet service is running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/wallet', walletRoutes);

app.use(errorHandler);

export default app;
