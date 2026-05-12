import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

/**
 * Validate incoming request against a Zod schema that may have
 * `body`, `query`, and/or `params` sub-schemas.
 *
 * Usage:
 *   router.post('/login', zodValidate(loginSchema), authController.login);
 */
export const zodValidate =
  (schema: AnyZodObject) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Parse only the parts the schema declares — avoids stripping valid
      // data when the schema only covers `body` and ignores `params`.
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Overwrite with coerced / transformed values
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query;
      if (parsed.params !== undefined) req.params = parsed.params;

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.issues.map((issue) => ({
          field: issue.path.filter((p) => p !== 'body' && p !== 'query' && p !== 'params').join('.') || issue.path.join('.'),
          message: issue.message,
        }));
        return next(ApiError.badRequest('Validation failed', errors));
      }
      next(err);
    }
  };
