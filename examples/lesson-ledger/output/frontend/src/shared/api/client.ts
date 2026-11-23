/** JSON client for the backend on the same origin (ADR-002). The browser sends the session
 * cookie itself; nothing auth-related is read or stored here (ADR-004). */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class NetworkError extends Error {
  constructor() {
    super("Network request failed");
    this.name = "NetworkError";
  }
}

/** Network failures and 5xx: the request may be retried, nothing is wrong with the input. */
export function isUnavailable(error: unknown): boolean {
  return error instanceof NetworkError || (error instanceof ApiError && error.status >= 500);
}

/** A failed load or submit shows an error unless the session ended: a 401 sends the teacher
 * to /login instead (queryClient). */
export function isShownFailure(error: unknown): boolean {
  return !hasStatus(error, 401);
}

/** Form-level message for a submit that failed with a network error or 5xx (F02). */
export const UNREACHABLE_ON_SUBMIT = "We couldn't reach Lesson Ledger. Please try again.";

export function hasStatus(error: unknown, status: number, code?: string): error is ApiError {
  return (
    error instanceof ApiError &&
    error.status === status &&
    (code === undefined || error.code === code)
  );
}

interface ErrorBody {
  error?: { code?: string; message?: string; details?: Record<string, unknown> };
}

async function readError(response: Response): Promise<ApiError> {
  let body: ErrorBody = {};
  try {
    body = (await response.json()) as ErrorBody;
  } catch {
    // Not JSON, e.g. a proxy error page.
  }
  return new ApiError(
    response.status,
    body.error?.code ?? "http_error",
    body.error?.message ?? response.statusText,
    body.error?.details ?? {},
  );
}

export async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new NetworkError();
  }
  if (!response.ok) {
    throw await readError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
