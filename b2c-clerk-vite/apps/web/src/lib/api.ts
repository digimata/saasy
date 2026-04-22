import { useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import useSWR, { type SWRConfiguration, type SWRResponse } from "swr";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export class APIError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.code = code;
  }
}

export type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
};

export async function fetchApi<T = unknown>(
  path: string,
  { body, token, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } } | null)?.error;
    throw new APIError(
      res.status,
      err?.code ?? "unknown",
      err?.message ?? `Request failed with status ${res.status}`,
    );
  }

  return data as T;
}

/**
 * SWR hook that attaches the current Clerk session token.
 * Pass `null` as the key to skip the request (e.g. until signed in).
 */
export function useApi<T = unknown>(
  path: string | null,
  config?: SWRConfiguration<T, APIError>,
): SWRResponse<T, APIError> {
  const { getToken, isSignedIn } = useAuth();

  return useSWR<T, APIError>(
    isSignedIn && path ? [path, "authed"] : null,
    async ([p]: [string, string]) => {
      const token = await getToken();
      return fetchApi<T>(p, { token });
    },
    config,
  );
}

/**
 * Returns an authed fetch helper that attaches the current Clerk session
 * token. Use for mutations (POST/PATCH/DELETE) — pair with SWR's `mutate`
 * to invalidate cached GETs.
 */
export function useAuthedFetch() {
  const { getToken } = useAuth();
  return useCallback(
    async <T = unknown>(path: string, options: RequestOptions = {}): Promise<T> => {
      const token = await getToken();
      return fetchApi<T>(path, { ...options, token });
    },
    [getToken],
  );
}
