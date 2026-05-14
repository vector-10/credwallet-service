import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../src/middlewares/error.middleware';
import { AppError } from '../../src/utils/errors';

const mockReq = {} as Request;
const mockNext = {} as NextFunction;

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res;
};

describe('errorHandler middleware', () => {
  it('should return the AppError statusCode and message when error is an AppError', () => {
    const res = mockRes();
    const error = new AppError(404, 'Wallet not found');

    errorHandler(error, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Wallet not found' });
  });

  it('should return 500 for unexpected errors that are not AppError', () => {
    const res = mockRes();
    const error = new Error('Something exploded');

    errorHandler(error, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'An unexpected error occurred' });
  });
});
