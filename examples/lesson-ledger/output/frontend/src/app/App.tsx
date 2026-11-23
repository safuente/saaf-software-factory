import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { HomePage } from "../features/auth/HomePage";
import { LoginPage } from "../features/auth/LoginPage";
import { PublicOnly, RequireSession } from "../features/auth/SessionGate";
import { SignupPage } from "../features/auth/SignupPage";
import { LessonsPage } from "../features/lessons/LessonsPage";
import { PendingPage } from "../features/payments/PendingPage";
import { SummaryPage } from "../features/payments/SummaryPage";
import { StudentsPage } from "../features/students/StudentsPage";
import { createQueryClient } from "./queryClient";

export function AppProviders({
  queryClient,
  children,
}: {
  queryClient: QueryClient;
  children: ReactNode;
}) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnly>
            <SignupPage />
          </PublicOnly>
        }
      />
      <Route
        path="/"
        element={<RequireSession>{(session) => <HomePage session={session} />}</RequireSession>}
      />
      <Route path="/lessons" element={<RequireSession>{() => <LessonsPage />}</RequireSession>} />
      <Route path="/students" element={<RequireSession>{() => <StudentsPage />}</RequireSession>} />
      <Route path="/summary" element={<RequireSession>{() => <SummaryPage />}</RequireSession>} />
      <Route path="/pending" element={<RequireSession>{() => <PendingPage />}</RequireSession>} />
      <Route
        path="*"
        element={<RequireSession>{() => <Navigate to="/" replace />}</RequireSession>}
      />
    </Routes>
  );
}

export function App() {
  const [queryClient] = useState(createQueryClient);
  return (
    <AppProviders queryClient={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  );
}
