import { createContext } from "react";

/** What the app shell offers on app pages: logging out (F01's request, provided by the session
 * gate) and its state. `Page` renders the Log out button and its failure alert from it. */
export interface Shell {
  logOut: () => void;
  loggingOut: boolean;
  logOutFailed: boolean;
}

export const ShellContext = createContext<Shell | null>(null);
