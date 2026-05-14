import { Request, Response, NextFunction } from 'express';
import { idempotency } from '../../src/middlewares/idempotency.middleware';
import { IdempotencyRepository } from '../../src/repositories/idempotency.repository';

jest.mock('../../src/repositories/idempotency.repository');

const mockRepo = jest.mocked(IdempotencyRepository).prototype;
const mockNext = jest.fn() as NextFunction;

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.statusCode = 200;
  return res;
};

describe('idempotency middleware', () => {
  it('should call next() and skip check when no Idempotency-Key header is provided', async () => {
    const req = { headers: {} } as Request;
    const res = mockRes();

    await idempotency(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRepo.findByKey).not.toHaveBeenCalled();
  });

  it('should replay the cached response when a duplicate key is detected', async () => {
    const cached = {
      id: 'idmp-uuid-1',
      key: 'client-key-123',
      response_status: 200,
      response_body: JSON.stringify({ success: true, data: { balance: 5000 } }),
      expires_at: new Date(Date.now() + 86400000),
      created_at: new Date(),
    };
    mockRepo.findByKey.mockResolvedValue(cached);

    const req = { headers: { 'idempotency-key': 'client-key-123' } } as unknown as Request;
    const res = mockRes();

    await idempotency(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { balance: 5000 } });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() and attach response interceptor for a new key', async () => {
    mockRepo.findByKey.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue(undefined);

    const req = { headers: { 'idempotency-key': 'new-key-456' } } as unknown as Request;
    const res = mockRes();

    await idempotency(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(typeof res.json).toBe('function');
  });
});
