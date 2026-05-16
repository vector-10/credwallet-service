import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error(error.message, { statusCode: error.statusCode, path: req.path, stack: error.stack });
    } else {
      logger.warn(error.message, { statusCode: error.statusCode, path: req.path });
    }
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }

  logger.error('Unhandled error', { message: error.message, path: req.path, stack: error.stack });
  res.status(500).json({ success: false, message: 'An unexpected error occurred' });
};
