import crypto from 'node:crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { NextResponse, type NextRequest } from 'next/server';
import { AuditEvent, User } from './models';
import { COOKIE_NAMES, ROLE_PERMISSIONS, type Permission, type Role } from './constants';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'campusvoice-dev-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'campusvoice-dev-refresh-secret';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '8h';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
// Secure cookies are required in production (HTTPS). Set COOKIE_SECURE=false
// only when testing a production build locally over plain HTTP.
const IS_PROD =
  process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === 'true'
    : process.env.NODE_ENV === 'production';

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status = 400, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export interface SessionUser {
  sub: string;
  username: string;
  email: string;
  fullName?: string;
  role: Role;
  permissions: string[];
  institutionId?: string;
  departmentId?: string;
  classId?: string;
  isActive?: boolean;
}

export function hasPermission(user: SessionUser | null | undefined, permission: Permission | string): boolean {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  const granted = new Set([...(ROLE_PERMISSIONS[user.role] || []), ...(user.permissions || [])]);
  return granted.has(permission as Permission);
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export function signAccessToken(user: any): string {
  return jwt.sign(
    {
      sub: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      permissions: user.permissions || [],
      institutionId: user.institutionId?.toString?.(),
      departmentId: user.departmentId?.toString?.(),
      classId: user.classId?.toString?.(),
      type: 'access',
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES as jwt.SignOptions['expiresIn'] },
  );
}

export function signRefreshToken(user: any): string {
  return jwt.sign(
    {
      sub: user._id.toString(),
      type: 'refresh',
      // Guarantees every rotation produces a distinct token, even when two
      // tokens are issued within the same second.
      jti: crypto.randomUUID(),
    },
    REFRESH_SECRET,
    {
      expiresIn: REFRESH_EXPIRES as jwt.SignOptions['expiresIn'],
    },
  );
}

export function verifyAccessToken(token: string): SessionUser {
  const payload = jwt.verify(token, ACCESS_SECRET) as any;
  if (payload.type !== 'access') throw new ApiError('Invalid access token', 401);
  return payload as SessionUser;
}

export function verifyRefreshToken(token: string): { sub: string } {
  const payload = jwt.verify(token, REFRESH_SECRET) as any;
  if (payload.type !== 'refresh') throw new ApiError('Invalid refresh token', 401);
  return payload;
}

const accessCookie = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 8 * 60 * 60,
};

const refreshCookie = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60,
};

export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  response.cookies.set(COOKIE_NAMES.ACCESS_TOKEN, accessToken, accessCookie);
  response.cookies.set(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, refreshCookie);
  return response;
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(COOKIE_NAMES.ACCESS_TOKEN, '', { ...accessCookie, maxAge: 0 });
  response.cookies.set(COOKIE_NAMES.REFRESH_TOKEN, '', { ...refreshCookie, maxAge: 0 });
  return response;
}

export function getTokenFromRequest(request: NextRequest): string | undefined {
  const cookieToken = request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
  if (cookieToken) return cookieToken;
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return undefined;
}

/** Verifies the JWT and confirms the account still exists and is active. */
export async function getCurrentUser(request: NextRequest): Promise<SessionUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub)
      .select('username email fullName role permissions institutionId departmentId classId isActive')
      .lean();
    if (!user || user.isActive === false) return null;
    return {
      sub: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      permissions: user.permissions || [],
      institutionId: user.institutionId?.toString(),
      departmentId: user.departmentId?.toString(),
      classId: user.classId?.toString(),
      isActive: user.isActive,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<SessionUser> {
  const user = await getCurrentUser(request);
  if (!user) throw new ApiError('Authentication required', 401);
  return user;
}

export async function requirePermission(
  request: NextRequest,
  permission: Permission | string,
): Promise<SessionUser> {
  const user = await requireAuth(request);
  if (!hasPermission(user, permission)) {
    throw new ApiError('You do not have permission to perform this action', 403);
  }
  return user;
}

export async function requireRole(request: NextRequest, roles: Role[]): Promise<SessionUser> {
  const user = await requireAuth(request);
  if (!roles.includes(user.role)) {
    throw new ApiError('You do not have access to this resource', 403);
  }
  return user;
}

export function sanitizeUser(user: any) {
  if (!user) return null;
  const source = typeof user.toObject === 'function' ? user.toObject() : user;
  const {
    passwordHash,
    passwordResetToken,
    passwordResetExpires,
    refreshTokens,
    __v,
    ...safe
  } = source;
  return safe;
}

export async function audit(
  action: string,
  options: {
    user?: { sub?: string; username?: string } | null;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
  } = {},
) {
  try {
    await AuditEvent.create({
      userId: options.user?.sub,
      username: options.user?.username,
      action,
      entityType: options.entityType,
      entityId: options.entityId,
      metadata: options.metadata || {},
      ip: options.ip,
      userAgent: options.userAgent,
    });
  } catch {
    // Audit logging must never break the request path.
  }
}

export function clientMeta(request: NextRequest) {
  return {
    ip:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      undefined,
    userAgent: request.headers.get('user-agent') || undefined,
  };
}
