import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { hasStatus } from "../../shared/api/client";
import { Alert } from "../../shared/ui/Alert";
import { Button } from "../../shared/ui/Button";
import { Form, Note, TextLink } from "../../shared/ui/Form";
import { SignedOutPage } from "../../shared/ui/SignedOutPage";
import { TextField } from "../../shared/ui/TextField";
import { signUp } from "./api";
import { SESSION_QUERY_KEY } from "./session";
import { useFieldErrors, type FieldErrors } from "./useFieldErrors";
import { isValidEmail, isValidSignupPassword } from "./validation";

const MESSAGES = {
  email: "Enter a valid email address, like name@example.com.",
  password: "Password must be at least 12 characters.",
  emailTaken: "An account with this email already exists.",
  failed: "Something went wrong. Please try again.",
};

function serverFieldErrors(details: Record<string, unknown>): FieldErrors {
  const errors: FieldErrors = {};
  const list = Array.isArray(details.errors) ? (details.errors as { loc?: unknown[] }[]) : [];
  for (const error of list) {
    const field = error.loc?.at(-1);
    if (field === "email" || field === "password") errors[field] = MESSAGES[field];
  }
  return errors;
}

export function SignupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { errors, show: showFieldErrors, emailRef, passwordRef } = useFieldErrors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [failed, setFailed] = useState(false);

  const mutation = useMutation({
    mutationFn: signUp,
    onSuccess: (session) => {
      queryClient.setQueryData(SESSION_QUERY_KEY, session);
      void navigate("/", { replace: true });
    },
    onError: (error) => {
      if (hasStatus(error, 409, "email_taken")) {
        showFieldErrors({ email: MESSAGES.emailTaken });
      } else if (hasStatus(error, 422) && Object.keys(serverFieldErrors(error.details)).length) {
        showFieldErrors(serverFieldErrors(error.details));
      } else {
        setFailed(true);
      }
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending) return;
    setFailed(false);
    const fieldErrors: FieldErrors = {};
    if (!isValidEmail(email)) fieldErrors.email = MESSAGES.email;
    if (!isValidSignupPassword(password)) fieldErrors.password = MESSAGES.password;
    if (showFieldErrors(fieldErrors)) return;
    mutation.mutate({ email: email.trim(), password });
  };

  return (
    <SignedOutPage title="Create your account" heading="Create your account">
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
          autoComplete="new-password"
          hint="At least 12 characters."
          value={password}
          onChange={setPassword}
          error={errors.password}
          ref={passwordRef}
        />
        {failed && <Alert>{MESSAGES.failed}</Alert>}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating account…" : "Create account"}
        </Button>
        <Note>
          Already have an account? <TextLink to="/login">Log in</TextLink>
        </Note>
      </Form>
    </SignedOutPage>
  );
}
