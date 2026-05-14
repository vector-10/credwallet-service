import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});

const walletLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'CredWallet service is running' });
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/wallet', walletLimiter, walletRoutes);

app.use(errorHandler);

export default app;
