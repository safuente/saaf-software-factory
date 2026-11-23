import { useEffect, useRef } from "react";

/** Focus for a form-level error (UX-1): the submit button is disabled while the request is in
 * flight, so focus moves to it once it is enabled again, never leaving focus on body. */
export function useSubmitFocus(pending: boolean) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wanted = useRef(false);
  useEffect(() => {
    if (!pending && wanted.current) {
      wanted.current = false;
      buttonRef.current?.focus();
    }
  });
  const focusButton = () => {
    wanted.current = true;
  };
  return { buttonRef, focusButton };
}
