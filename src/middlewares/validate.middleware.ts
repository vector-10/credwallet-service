import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';

export const validate = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.flatten((i) => i.message).fieldErrors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
};
