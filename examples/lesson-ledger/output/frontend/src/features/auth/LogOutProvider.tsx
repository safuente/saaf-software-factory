import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { hasStatus } from "../../shared/api/client";
import { ShellContext } from "../../shared/ui/shell";
import { logOut } from "./api";
import { rememberLoggedOut } from "./loggedOut";

/** Log out for the shell of every app page (F01 behaviour, moved out of Home by F06). */
export function LogOutProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const leave = () => {
    // Discard every cached server response so Back cannot show this teacher's data.
    queryClient.clear();
    // Pushed, not replaced: Back returns to the page, which the session gate sends to /login.
    void navigate("/login");
  };

  const logout = useMutation({
    mutationFn: logOut,
    onSuccess: () => {
      // Only a log out the server confirmed earns the notice on Log in (F09 AC-3); a 401 does not.
      rememberLoggedOut();
      leave();
    },
    onError: (error) => {
      if (hasStatus(error, 401)) leave();
    },
  });

  return (
    <ShellContext
      value={{
        logOut: () => logout.mutate(),
        loggingOut: logout.isPending,
        logOutFailed: logout.isError && !hasStatus(logout.error, 401),
      }}
    >
      {children}
    </ShellContext>
  );
}
