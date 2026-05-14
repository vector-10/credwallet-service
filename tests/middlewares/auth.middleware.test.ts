import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../src/middlewares/auth.middleware';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
jest.mock('../../src/config/env', () => ({
  env: { JWT_SECRET: 'test-secret' },
}));

const mockNext = jest.fn() as NextFunction;

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res;
};

describe('authenticate middleware', () => {
  it('should call next() and set req.user when token is valid', () => {
    const decoded = { userId: 'user-uuid-1', email: 'test@example.com' };
    (jwt.verify as jest.Mock).mockReturnValue(decoded);

    const req = { headers: { authorization: 'Bearer valid-token' } } as Request;
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(req.user).toEqual(decoded);
    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 when Authorization header is missing', () => {
    const req = { headers: {} } as Request;
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Access token required' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid or expired', () => {
    (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid token'); });

    const req = { headers: { authorization: 'Bearer bad-token' } } as Request;
    const res = mockRes();

    authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid or expired token' });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
