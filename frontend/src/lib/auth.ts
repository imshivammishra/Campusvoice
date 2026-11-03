import { apiRequest, ApiError } from './api';

export interface AuthUser {
  sub?: string;
  _id?: string;
  username: string;
  email?: string;
  fullName?: string;
  role: string;
  permissions?: string[];
  institutionId?: string;
  departmentId?: string;
  classId?: string;
  isActive?: boolean;
}

const USER_STORAGE_KEY = 'cv_user';

/**
 * Auth tokens live in HttpOnly cookies and are intentionally NOT readable from
 * JavaScript. We cache a non-sensitive copy of the user profile in localStorage
 * purely for instant UI rendering; the cookie session remains the source of
 * truth and is verified via `/auth/me`.
 */
export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export async function login(
  usernameOrEmail: string,
  password: string,
): Promise<AuthUser> {
  const data = await apiRequest<{ user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usernameOrEmail, password }),
  });
  setStoredUser(data.user);
  return data.user;
}

/** Verifies the cookie session against the backend and refreshes the cache. */
export async function fetchCurrentUser(): Promise<AuthUser> {
  const data = await apiRequest<{ user: AuthUser }>('/auth/me');
  setStoredUser(data.user);
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (err) {
    // Ignore network/401 errors on logout; we clear local state regardless.
    if (!(err instanceof ApiError)) {
      // noop
    }
  } finally {
    setStoredUser(null);
  }
}

