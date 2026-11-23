import { render } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { AppProviders, AppRoutes } from "../app/App";
import { createQueryClient } from "../app/queryClient";

/** Every path the router has shown, in order, so tests can assert where the app went. */
export const visitedPaths: string[] = [];

function LocationRecorder() {
  const location = useLocation();
  if (visitedPaths.at(-1) !== location.pathname) {
    visitedPaths.push(location.pathname);
  }
  return (
    <>
      <div data-testid="location">{location.pathname}</div>
      <div data-testid="search">{location.search}</div>
    </>
  );
}

export function renderApp(path: string) {
  visitedPaths.length = 0;
  const queryClient = createQueryClient();
  const view = render(
    <AppProviders queryClient={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
        <LocationRecorder />
      </MemoryRouter>
    </AppProviders>,
  );
  return { ...view, queryClient };
}
