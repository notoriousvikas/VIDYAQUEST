import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';

export type UserRole = 'student' | 'teacher' | 'guardian' | 'admin';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

interface JwtPayload {
  sub: string;
  role: UserRole;
  email: string;
  name: string;
}

/**
 * Verifies the Bearer JWT from the Authorization header and attaches req.user.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    next(new AppError('Invalid authentication token', 401, 'UNAUTHORIZED'));
    return;
  }

  try {
    const decoded = jwt.verify(token, env.AUTH_SECRET) as JwtPayload;
    if (!decoded.sub || !decoded.role) {
      next(new AppError('Invalid token payload', 401, 'UNAUTHORIZED'));
      return;
    }
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
    };
    next();
  } catch {
    next(new AppError('Session expired or invalid token', 401, 'TOKEN_INVALID'));
  }
}

/**
 * Enforces role-based authorization on protected routes.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
      return;
    }
    next();
  };
}
