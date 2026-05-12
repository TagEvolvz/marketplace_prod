import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * Stamps each incoming request with a UUID.
 *
 * - Reuses `X-Request-ID` if the client or upstream proxy already set one.
 * - Echoes the ID back in the response header so clients and logs correlate.
 * - Attaches `req.requestId` for use in logger calls and error responses.
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const id =
    (req.headers['x-request-id'] as string | undefined)?.slice(0, 64) || randomUUID();

  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};
