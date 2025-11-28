import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

function generateToken(): string {
  return randomBytes(TOKEN_LENGTH).toString('hex');
}

export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  let csrfToken = req.cookies[CSRF_COOKIE_NAME];
  
  if (!csrfToken) {
    csrfToken = generateToken();
    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
  }
  
  (req as any).csrfToken = csrfToken;
  
  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }
  
  if (req.path.startsWith('/api/webhooks/')) {
    return next();
  }
  
  const headerToken = req.headers[CSRF_HEADER_NAME] as string;
  
  if (!headerToken || headerToken !== csrfToken) {
    console.warn('CSRF validation failed', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      hasHeader: !!headerToken,
      tokenMatch: headerToken === csrfToken,
    });
    res.status(403).json({ 
      message: 'Ошибка безопасности. Пожалуйста, обновите страницу и попробуйте снова.' 
    });
    return;
  }
  
  next();
}

export function csrfTokenEndpoint(req: Request, res: Response): void {
  let csrfToken = req.cookies[CSRF_COOKIE_NAME];
  
  if (!csrfToken) {
    csrfToken = generateToken();
    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
  }
  
  res.json({ csrfToken });
}
