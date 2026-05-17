import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';
import { errorHandler } from './middlewares/error.middleware';
import { authLimiter } from './middlewares/rate-limit.middleware';
import { env } from './config/env';
import logger from './utils/logger';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

app.use(cors({
  origin: env.ALLOWED_ORIGIN ?? '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
}));

app.use(morgan('combined', {
  stream: { write: (msg: string) => logger.http(msg.trim()) },
}));

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'CredWallet service is running' });
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/wallet', walletRoutes);

app.use(errorHandler);

export default app;
