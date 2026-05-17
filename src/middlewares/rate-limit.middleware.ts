import rateLimit from 'express-rate-limit';

const rateLimitMessage = { success: false, message: 'Too many requests, please try again later' };

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

export const walletReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

export const walletWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});
