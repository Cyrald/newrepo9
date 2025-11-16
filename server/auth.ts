import bcrypt from "bcryptjs";
import { type Request, type Response, type NextFunction } from "express";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRoles?: string[];
    }
  }
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.session || !req.session.userId) {
      res.status(401).json({ message: "Требуется аутентификация" });
      return;
    }

    req.userId = req.session.userId;
    req.userRoles = req.session.userRoles || [];

    next();
  } catch (error) {
    res.status(401).json({ message: "Ошибка аутентификации" });
  }
}

export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.userId) {
      res.status(401).json({ message: "Требуется аутентификация" });
      return;
    }

    if (!req.userRoles) {
      res.status(403).json({ message: "Роли пользователя не загружены" });
      return;
    }

    const hasRole = req.userRoles.some(role => roles.includes(role));
    if (!hasRole) {
      res.status(403).json({ message: "Недостаточно прав" });
      return;
    }

    next();
  };
}
