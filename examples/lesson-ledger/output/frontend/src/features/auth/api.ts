import { apiRequest, hasStatus } from "../../shared/api/client";
import type { components } from "../../shared/api/schema";

export type SessionBody = components["schemas"]["SessionBody"];
type Credentials = components["schemas"]["SignUpRequest"];

export function signUp(credentials: Credentials): Promise<SessionBody> {
  return apiRequest<SessionBody>("POST", "/api/teachers", credentials);
}

export function logIn(credentials: Credentials): Promise<SessionBody> {
  return apiRequest<SessionBody>("POST", "/api/sessions", credentials);
}

export function logOut(): Promise<undefined> {
  return apiRequest<undefined>("DELETE", "/api/sessions/current");
}

/** The current session, or null when the server says there is none (401). */
export async function getCurrentSession(): Promise<SessionBody | null> {
  try {
    return await apiRequest<SessionBody>("GET", "/api/sessions/current");
  } catch (error) {
    if (hasStatus(error, 401)) return null;
    throw error;
  }
}
