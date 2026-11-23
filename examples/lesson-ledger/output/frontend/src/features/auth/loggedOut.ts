/**
 * "You have logged out." (F09 AC-3): shown once, on the Log in page that directly follows a log
 * out the server confirmed (204). The fact lives in this module's memory only, never in a
 * cookie, the URL or browser storage, so a reload, Back/Forward or any later visit of Log in
 * starts without it, and no link can make Log in show it.
 */
let justLoggedOut = false;

/** Called by Log out after `DELETE /api/sessions/current` answered 204. */
export function rememberLoggedOut(): void {
  justLoggedOut = true;
}

/** True once after `rememberLoggedOut`, then false until the next confirmed log out. */
export function takeLoggedOut(): boolean {
  const was = justLoggedOut;
  justLoggedOut = false;
  return was;
}
