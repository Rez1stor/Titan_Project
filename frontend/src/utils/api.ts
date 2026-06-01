export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

type ApiFetchOptions = RequestInit & {
  /** When true (default), parse JSON body automatically. Set false for 204/no-body responses. */
  parseJson?: boolean;
};

/**
 * Thin fetch wrapper with credentials, JSON defaults, and unified error handling.
 */
export async function apiFetch<T>(url: string, options: ApiFetchOptions = {}): Promise<T> {
  const { parseJson = true, headers, ...rest } = options;

  const response = await fetch(url, {
    credentials: 'include',
    ...rest,
    headers: {
      ...(parseJson ? { Accept: 'application/json' } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    let message = response.statusText || 'Request failed';
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
      else if (body?.title) message = body.title;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(response.status, message);
  }

  if (!parseJson || response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/** Returns the current authenticated user id, or null when not logged in. */
export async function getCurrentUserId(): Promise<number | null> {
  try {
    const user = await apiFetch<{ userId?: number }>('/api/auth/me');
    return user?.userId ?? null;
  } catch {
    return null;
  }
}

/** Builds headers with X-User-Id from the current session. */
export async function userHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const userId = await getCurrentUserId();
  return {
    ...(userId != null ? { 'X-User-Id': String(userId) } : {}),
    ...extra,
  };
}
