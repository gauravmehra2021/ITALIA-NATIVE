import { API_BASE_URL, API_TIMEOUT_MS, apiEndpoints, isApiConfigured } from '../config/api';
import { ApiError, ConfigurationError } from './errors';
import { clearSessionTokens, getSessionTokens, notifySessionExpired, saveSessionTokens } from './sessionStore';
import { parseApiResponse, responseContracts } from './contracts';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  authenticated?: boolean;
  retryUnauthorized?: boolean;
};

type ApiErrorPayload = {
  title?: string;
  detail?: string;
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
};

let refreshInFlight: Promise<boolean> | null = null;

function getAbsoluteUrl(path: string): string {
  if (!isApiConfigured) {
    throw new ConfigurationError('Set API_BASE_URL in src/config/api.ts before making API requests.');
  }

  const baseUrl = API_BASE_URL.trim().replace(/\/+$/, '');
  let parsedBaseUrl: URL;
  try {
    parsedBaseUrl = new URL(baseUrl);
  } catch {
    throw new ConfigurationError('API_BASE_URL must be an absolute HTTP or HTTPS URL.');
  }
  if (
    !['http:', 'https:'].includes(parsedBaseUrl.protocol) ||
    !parsedBaseUrl.hostname ||
    parsedBaseUrl.username.length > 0 ||
    parsedBaseUrl.password.length > 0
  ) {
    throw new ConfigurationError('API_BASE_URL must be an absolute HTTP or HTTPS URL without embedded credentials.');
  }

  return `${baseUrl}/${path.replace(/^\/+/, '')}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('json')) {
    const text = await response.text();
    if (!response.ok) {
      throw new ApiError(text || `Request failed (${response.status}).`, response.status);
    }
    throw new ApiError('The server returned an unexpected response format.', 502, 'invalid_response');
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('The server returned invalid JSON.', 502, 'invalid_response');
  }
  if (!response.ok) {
    const payload = data as ApiErrorPayload;
    throw new ApiError(
      payload.detail ?? payload.title ?? payload.message ?? `Request failed (${response.status}).`,
      response.status,
      payload.code,
      payload.errors,
    );
  }

  return data as T;
}

async function refreshAccessToken(): Promise<boolean> {
  const tokens = await getSessionTokens();
  if (!tokens?.refreshToken) {
    await clearSessionTokens();
    notifySessionExpired();
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(getAbsoluteUrl(apiEndpoints.auth.refresh), {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      signal: controller.signal,
    });
    const payload = parseApiResponse(await parseResponse<unknown>(response), responseContracts.refreshedTokens);
    await saveSessionTokens(payload);
    return true;
  } catch (cause) {
    if (cause instanceof ApiError && cause.status >= 400 && cause.status < 500 && cause.status !== 429) {
      await clearSessionTokens();
      notifySessionExpired();
      return false;
    }
    throw cause;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    body,
    authenticated = true,
    retryUnauthorized = true,
    headers: suppliedHeaders,
    signal,
    ...requestOptions
  } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', abortFromCaller, { once: true });
  try {
    const headers = new Headers(suppliedHeaders);
    headers.set('Accept', 'application/json');
    if (body !== undefined) {
      headers.set('Content-Type', 'application/json');
    }

    if (authenticated) {
      const tokens = await getSessionTokens();
      if (tokens?.accessToken) {
        headers.set('Authorization', `Bearer ${tokens.accessToken}`);
      }
    }

    const response = await fetch(getAbsoluteUrl(path), {
      ...requestOptions,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    if (response.status === 401 && authenticated && retryUnauthorized) {
      refreshInFlight ??= refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });
      const refreshed = await refreshInFlight;
      if (refreshed) {
        return apiRequest<T>(path, { ...options, retryUnauthorized: false });
      }
    }

    return await parseResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError || error instanceof ConfigurationError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('The request timed out. Check your connection and try again.', 408, 'timeout');
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Unable to connect. Check your network and try again.',
      0,
      'network_error',
    );
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}
