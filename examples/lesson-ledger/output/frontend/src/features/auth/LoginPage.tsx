import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { hasStatus } from "../../shared/api/client";
import { Alert } from "../../shared/ui/Alert";
import { Button } from "../../shared/ui/Button";
import { Form, Note, TextLink } from "../../shared/ui/Form";
import { SignedOutPage } from "../../shared/ui/SignedOutPage";
import { TextField } from "../../shared/ui/TextField";
import { logIn } from "./api";
import { takeLoggedOut } from "./loggedOut";
import { SESSION_QUERY_KEY } from "./session";
import { useFieldErrors, type FieldErrors } from "./useFieldErrors";

const MESSAGES = {
  email: "Enter your email.",
  password: "Enter your password.",
  incorrect: "Email or password is incorrect.",
  failed: "Something went wrong. Please try again.",
  loggedOut: "You have logged out.",
};

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { errors, show: showFieldErrors, emailRef, passwordRef } = useFieldErrors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState<string>();
  const [loggedOut, setLoggedOut] = useState(false);

  // Filled just after the page appears, so the status region is already in the page and
  // announces the text (F09 AC-3). Taken inside the timer, so a cancelled effect (StrictMode)
  // leaves the notice for the effect that stays.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (takeLoggedOut()) setLoggedOut(true);
    });
    return () => window.clearTimeout(timer);
  }, []);

  const mutation = useMutation({
    mutationFn: logIn,
    onSuccess: (session) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, session);
      void navigate("/", { replace: true });
    },
    onError: (error) => {
      if (hasStatus(error, 401, "invalid_credentials")) {
        setPassword("");
        setAlert(MESSAGES.incorrect);
      } else {
        setAlert(MESSAGES.failed);
      }
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending) return;
    setAlert(undefined);
    const fieldErrors: FieldErrors = {};
    if (!email.trim()) fieldErrors.email = MESSAGES.email;
    if (!password) fieldErrors.password = MESSAGES.password;
    if (showFieldErrors(fieldErrors)) return;
    mutation.mutate({ email: email.trim(), password });
  };

  return (
    <SignedOutPage title="Log in" heading="Log in" notice={loggedOut ? MESSAGES.loggedOut : ""}>
      <Form onSubmit={onSubmit}>
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="username"
          hint="Example: name@example.com"
          value={email}
          onChange={setEmail}
          error={errors.email}
          ref={emailRef}
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          ref={passwordRef}
        />
        {alert && <Alert>{alert}</Alert>}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Logging in…" : "Log in"}
        </Button>
        <Note>
          No account yet? <TextLink to="/signup">Create an account</TextLink>
        </Note>
      </Form>
    </SignedOutPage>
  );
}
