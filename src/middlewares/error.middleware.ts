import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(`[Error] ${error.message}`, error.stack);

  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
  });
};
