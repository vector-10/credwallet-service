import { Request, Response, NextFunction } from 'express';
import { IdempotencyRepository } from '../repositories/idempotency.repository';

const idempotencyRepository = new IdempotencyRepository();
const PENDING_TTL_MS = 5 * 60 * 1000;
const SUCCESS_TTL_MS = 24 * 60 * 60 * 1000;

export const idempotency = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const key = req.headers['idempotency-key'] as string | undefined;

  if (!key) {
    res.status(400).json({ success: false, message: 'Idempotency-Key header is required' });
    return;
  }

  if (key.length > 255) {
    res.status(400).json({ success: false, message: 'Idempotency-Key must not exceed 255 characters' });
    return;
  }

  try {
    await idempotencyRepository.create({
      key,
      expires_at: new Date(Date.now() + PENDING_TTL_MS),
    });
  } catch (e: any) {
    if (e.code === 'ER_DUP_ENTRY') {
      const existing = await idempotencyRepository.findByKey(key);

      if (!existing) {
        next();
        return;
      }

      if (existing.status === 'SUCCESS') {
        res.status(existing.response_status!).json(JSON.parse(existing.response_body!));
        return;
      }

      res.status(409).json({
        success: false,
        message: 'A request with this key is already being processed. Please retry after a moment.',
      });
      return;
    }
    throw e;
  }

  let responseBody: any;
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    responseBody = body;
    return originalJson(body);
  };

  res.on('finish', () => {
    void (async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const successExpiry = new Date(Date.now() + SUCCESS_TTL_MS);
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            await idempotencyRepository.updateToSuccess(
              key,
              res.statusCode,
              JSON.stringify(responseBody),
              successExpiry,
            );
            break;
          } catch {}
        }
      } else {
        await idempotencyRepository.delete(key).catch(() => {});
      }
    })();
  });

  next();
};
