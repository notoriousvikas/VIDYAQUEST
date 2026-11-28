import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { AppError } from '../../../middleware/errorHandler';
import { UserRole } from '../../../middleware/auth';
import { UserModel } from '../models/User.model';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const keyBuffer = Buffer.from(keyHex, 'hex');
  const derivedBuffer = crypto.scryptSync(password, salt, 64);
  if (keyBuffer.length !== derivedBuffer.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
}

function signAccessToken(user: {
  id: string;
  role: UserRole;
  email: string;
  name: string;
}): string {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    env.AUTH_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );
}

export class AuthService {
  async registerStudent(input: {
    name: string;
    email: string;
    password: string;
    grade?: string;
  }) {
    const existing = await UserModel.findOne({ email: input.email }).lean();
    if (existing) {
      throw new AppError('An account with this email already exists', 409, 'EMAIL_EXISTS');
    }

    // Never trust client-supplied role: public registration always creates a student.
    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash: hashPassword(input.password),
      role: 'student',
      grade: input.grade,
    });

    const userView = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      grade: user.grade,
    };

    const token = signAccessToken(userView);
    return { user: userView, token };
  }

  async login(input: { email: string; password: string }) {
    const user = await UserModel.findOne({ email: input.email });
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const userView = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      grade: user.grade,
    };

    const token = signAccessToken(userView);
    return { user: userView, token };
  }

  async getProfile(userId: string) {
    const user = await UserModel.findById(userId).select('-passwordHash').lean();
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      grade: user.grade,
    };
  }
}

export const authService = new AuthService();
