/**
 * Fakes the backend at its client boundary (window.fetch) for component tests.
 * Each route answers with a JSON response, a network failure, or a pending promise.
 */
import { vi } from "vitest";

type Reply =
  | { status: number; body?: unknown }
  | { network: true }
  | { pending: Promise<{ status: number; body?: unknown }> };

type Handler = (request: RecordedRequest) => Reply;

export interface RecordedRequest {
  method: string;
  path: string;
  body: unknown;
  headers: Record<string, string>;
}

export const session = (email: string) => ({
  teacher: { email },
  expires_at: "2026-12-01T10:00:00Z",
});

export const apiError = (status: number, code: string, message: string) => ({
  status,
  body: { error: { code, message, details: {} } },
});

export const notAuthenticated = apiError(401, "not_authenticated", "Authentication required");

function toResponse(reply: { status: number; body?: unknown }): Response {
  const body = reply.body === undefined ? null : JSON.stringify(reply.body);
  return new Response(body, {
    status: reply.status,
    headers: body ? { "Content-Type": "application/json" } : {},
  });
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

export function fakeApi(routes: Record<string, Handler | Reply>) {
  const requests: RecordedRequest[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const method = (init.method ?? "GET").toUpperCase();
    const path = String(input);
    const headers = Object.fromEntries(new Headers(init.headers).entries());
    const body = typeof init.body === "string" ? JSON.parse(init.body) : init.body;
    const request = { method, path, body, headers };
    requests.push(request);
    // "*" answers every request without an exact route, e.g. paths with ids or months.
    const route = routes[`${method} ${path}`] ?? routes["*"];
    if (!route) {
      throw new Error(`Unexpected request ${method} ${path}`);
    }
    const reply = typeof route === "function" ? route(request) : route;
    if ("network" in reply) {
      throw new TypeError("Failed to fetch");
    }
    if ("pending" in reply) {
      return toResponse(await reply.pending);
    }
    return toResponse(reply);
  });
  vi.stubGlobal("fetch", fetchMock);
  return {
    requests,
    route(key: string, handler: Handler | Reply) {
      routes[key] = handler;
    },
    calls(key: string) {
      return requests.filter((r) => `${r.method} ${r.path}` === key);
    },
  };
}
