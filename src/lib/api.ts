const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

// Origin that serves uploaded files (strip the "/api/v1" suffix).
export const FILE_BASE = API_URL.replace(/\/api\/v\d+\/?$/, '');

export function fileUrl(path?: string): string {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return `${FILE_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function rawRequest(path: string, options: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.headers) {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    // Required so the browser stores and sends the HttpOnly auth cookies.
    credentials: 'include',
  });
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = rawRequest('/auth/refresh', { method: 'POST' })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        // Allow a new refresh attempt on the next 401.
        setTimeout(() => {
          refreshPromise = null;
        }, 0);
      });
  }
  return refreshPromise;
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response = await rawRequest(path, options);

  // Transparently refresh the access token once on 401, then retry.
  if (
    response.status === 401 &&
    path !== '/auth/login' &&
    path !== '/auth/refresh'
  ) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      response = await rawRequest(path, options);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      (Array.isArray(errorData?.message)
        ? errorData.message.join(', ')
        : errorData?.message) || `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json().catch(() => ({})) as Promise<T>;
}

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
  mimetype?: string;
}

/** Uploads a single file as multipart/form-data and returns its stored URL. */
export async function uploadFile(file: File): Promise<UploadedFile> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL}/uploads`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(err?.message || `Upload failed (${res.status})`, res.status);
  }
  return res.json();
}
