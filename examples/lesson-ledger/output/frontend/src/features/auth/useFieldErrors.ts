import { useRef, useState } from "react";

export interface FieldErrors {
  email?: string;
  password?: string;
}

/** Field errors of the email/password forms; showing them focuses the first invalid field. */
export function useFieldErrors() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  /** Returns true when there is at least one error. */
  const show = (fieldErrors: FieldErrors): boolean => {
    setErrors(fieldErrors);
    if (fieldErrors.email) emailRef.current?.focus();
    else if (fieldErrors.password) passwordRef.current?.focus();
    return Boolean(fieldErrors.email || fieldErrors.password);
  };

  return { errors, show, emailRef, passwordRef };
}
