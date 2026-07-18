import type { NextFunction, Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { loadConfig } from '../config.js';

const config = loadConfig();

// Single-user app: one shared secret, sent as x-api-key by the web app's
// server-side proxy. No user accounts, no sessions.
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const provided = req.header('x-api-key') ?? '';
  const expected = config.API_KEY;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.status(401).json({ error: 'Invalid or missing x-api-key' });
    return;
  }
  next();
}
