import { Request, Response, NextFunction } from 'express';
import { idempotency } from '../../src/middlewares/idempotency.middleware';
import { IdempotencyRepository } from '../../src/repositories/idempotency.repository';

jest.mock('../../src/repositories/idempotency.repository');
jest.mock('../../src/config/database', () => ({ default: {} }));

const mockRepo = jest.mocked(IdempotencyRepository).prototype;
const mockNext = jest.fn() as NextFunction;

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.on = jest.fn();
  res.statusCode = 200;
  return res;
};

describe('idempotency middleware', () => {
  it('should return 400 when no Idempotency-Key header is provided', async () => {
    const req = { headers: {} } as Request;
    const res = mockRes();

    await idempotency(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Idempotency-Key header is required',
    });
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('should replay cached response when key exists with SUCCESS status', async () => {
    const cached = {
      id: 'idmp-uuid-1',
      key: 'client-key-123',
      status: 'SUCCESS' as const,
      response_status: 200,
      response_body: JSON.stringify({ success: true, data: { balance: 5000 } }),
      expires_at: new Date(Date.now() + 86400000),
      created_at: new Date(),
    };
    mockRepo.create.mockRejectedValue({ code: 'ER_DUP_ENTRY' });
    mockRepo.findByKey.mockResolvedValue(cached);

    const req = { headers: { 'idempotency-key': 'client-key-123' } } as unknown as Request;
    const res = mockRes();

    await idempotency(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { balance: 5000 } });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 409 when key exists with PENDING status', async () => {
    const pending = {
      id: 'idmp-uuid-2',
      key: 'client-key-456',
      status: 'PENDING' as const,
      response_status: null,
      response_body: null,
      expires_at: new Date(Date.now() + 86400000),
      created_at: new Date(),
    };
    mockRepo.create.mockRejectedValue({ code: 'ER_DUP_ENTRY' });
    mockRepo.findByKey.mockResolvedValue(pending);

    const req = { headers: { 'idempotency-key': 'client-key-456' } } as unknown as Request;
    const res = mockRes();

    await idempotency(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'A request with this key is already being processed. Please retry after a moment.',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should claim key and attach response interceptors for a new request', async () => {
    mockRepo.create.mockResolvedValue(undefined);

    const req = { headers: { 'idempotency-key': 'new-key-789' } } as unknown as Request;
    const res = mockRes();

    await idempotency(req, res, mockNext);

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'new-key-789' })
    );
    expect(mockNext).toHaveBeenCalled();
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(typeof res.json).toBe('function');
  });
});
