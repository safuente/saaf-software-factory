import { describe, expect, it } from "vitest";
import { SESSION_QUERY_KEY } from "../features/auth/session";
import { ApiError } from "../shared/api/client";
import { createQueryClient } from "./queryClient";

const unauthenticated = () =>
  Promise.reject(new ApiError(401, "not_authenticated", "Authentication required", {}));
const alice = { teacher: { email: "alice@example.com" }, expires_at: "2026-12-01T10:00:00Z" };

describe("AC-4 any 401 not_authenticated from any API call ends the session in the app", () => {
  it("clears the session when a query fails with 401", async () => {
    const client = createQueryClient();
    client.setQueryData(SESSION_QUERY_KEY, alice);

    await client.fetchQuery({ queryKey: ["students"], queryFn: unauthenticated }).catch(() => {});

    expect(client.getQueryData(SESSION_QUERY_KEY)).toBeNull();
  });

  it("clears the session when a mutation fails with 401", async () => {
    const client = createQueryClient();
    client.setQueryData(SESSION_QUERY_KEY, alice);

    await client
      .getMutationCache()
      .build(client, { mutationFn: unauthenticated })
      .execute(undefined)
      .catch(() => {});

    expect(client.getQueryData(SESSION_QUERY_KEY)).toBeNull();
  });

  it("keeps the session on other errors", async () => {
    const client = createQueryClient();
    client.setQueryData(SESSION_QUERY_KEY, alice);
    const failed = () => Promise.reject(new ApiError(500, "internal_error", "Internal", {}));

    await client.fetchQuery({ queryKey: ["students"], queryFn: failed }).catch(() => {});

    expect(client.getQueryData(SESSION_QUERY_KEY)).toEqual(alice);
  });
});
