import { NextResponse, type NextRequest } from 'next/server';
import { ApiError, getCurrentUser, type SessionUser } from './auth';

export interface RouteContext {
  req: NextRequest;
  method: string;
  segments: string[];
  searchParams: URLSearchParams;
  body: <T = any>() => Promise<T>;
  user: () => Promise<SessionUser | null>;
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ message, error: message, details }, { status });
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return fail(error.message, error.status, error.details);
  }
  const err = error as any;
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'value';
    return fail(`A record with this ${field} already exists`, 409);
  }
  if (err?.name === 'CastError') {
    return fail('Invalid identifier supplied', 400);
  }
  if (err?.name === 'ValidationError') {
    return fail(err.message || 'Validation failed', 422);
  }
  console.error('[api]', error);
  return fail(err?.message || 'Internal server error', 500);
}

export function createContext(req: NextRequest, segments: string[]): RouteContext {
  let cachedBody: any;
  let bodyPromise: Promise<any> | null = null;
  let userPromise: Promise<SessionUser | null> | null = null;
  return {
    req,
    method: req.method,
    segments,
    searchParams: req.nextUrl.searchParams,
    body: async <T = any>() => {
      if (cachedBody !== undefined) return cachedBody as T;
      if (!bodyPromise) {
        bodyPromise = req
          .json()
          .then((value) => {
            cachedBody = value ?? {};
            return cachedBody;
          })
          .catch(() => ({}));
      }
      return (await bodyPromise) as T;
    },
    user: () => {
      if (!userPromise) userPromise = getCurrentUser(req);
      return userPromise;
    },
  };
}

export function pageParams(searchParams: URLSearchParams, defaultLimit = 50) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit), 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export function paginated(data: unknown[], total: number, page: number, limit: number) {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function makeId(prefix: string): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${stamp}-${random}`;
}

export function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(`${field} is required`, 422);
  }
  return value.trim();
}

export function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  if (typeof value === 'string' && value) return [value];
  return [];
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
