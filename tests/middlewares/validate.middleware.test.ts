import { Request, Response, NextFunction } from 'express';
import { validate } from '../../src/middlewares/validate.middleware';
import { fundWalletSchema } from '../../src/validators';

const mockNext = jest.fn() as NextFunction;

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res;
};

describe('validate middleware', () => {
  it('should call next() when request body passes schema validation', () => {
    const req = { body: { amount: 500 } } as Request;
    const res = mockRes();

    validate(fundWalletSchema)(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 422 with field errors when body fails validation', () => {
    const req = { body: { amount: -100 } } as Request;
    const res = mockRes();

    validate(fundWalletSchema)(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Validation failed' })
    );
  });

  it('should replace req.body with the parsed and cleaned data after validation', () => {
    const req = { body: { amount: 500, unexpectedField: 'hacker' } } as Request;
    const res = mockRes();

    validate(fundWalletSchema)(req, res, mockNext);

    expect(req.body).toEqual({ amount: 500 });
    expect(req.body).not.toHaveProperty('unexpectedField');
  });
});
