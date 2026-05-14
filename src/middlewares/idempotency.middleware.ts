import { Request, Response, NextFunction } from 'express';
import { IdempotencyRepository } from '../repositories/idempotency.repository';

const idempotencyRepository = new IdempotencyRepository();
const TTL_MS = 24 * 60 * 60 * 1000;

export const idempotency = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const key = req.headers['idempotency-key'] as string | undefined;

  if (!key) return next();

  const existing = await idempotencyRepository.findByKey(key);
  if (existing) {
    res.status(existing.response_status).json(JSON.parse(existing.response_body));
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyRepository
        .create({
          key,
          response_status: res.statusCode,
          response_body: JSON.stringify(body),
          expires_at: new Date(Date.now() + TTL_MS),
        })
        .catch(() => {});
    }
    return originalJson(body);
  };

  next();
};
