import { useRef, useState } from "react";

export type Errors<K extends string> = Partial<Record<K, string>>;

/** Field errors of one form (UX-1, UX-3): showing errors focuses the first invalid field in
 * `order`; `clear(field)` removes only that field's error, e.g. when its value changes. */
export function useFormErrors<K extends string>(order: readonly K[]) {
  const elements = useRef<Partial<Record<K, HTMLElement | null>>>({});
  const [errors, setErrors] = useState<Errors<K>>({});

  /** Returns true when there is at least one error. */
  const show = (fieldErrors: Errors<K>): boolean => {
    setErrors(fieldErrors);
    const first = order.find((field) => fieldErrors[field]);
    if (first) elements.current[first]?.focus();
    return first !== undefined;
  };

  const clear = (field: K) =>
    setErrors((current) => {
      if (!current[field]) return current;
      return { ...current, [field]: undefined };
    });

  const ref = (field: K) => (element: HTMLElement | null) => {
    elements.current[field] = element;
  };

  const focus = (field: K) => elements.current[field]?.focus();

  return { errors, show, clear, ref, focus };
}

interface ValidationDetail {
  loc?: unknown[];
  type?: unknown;
}

/** The fields named by a 422 validation_error's details, with the pydantic error type. Field
 * paths are joined with ".", e.g. "price.amount". */
export function invalidFields(details: Record<string, unknown>): Map<string, string> {
  const fields = new Map<string, string>();
  const list = Array.isArray(details.errors) ? (details.errors as ValidationDetail[]) : [];
  for (const error of list) {
    const path = (error.loc ?? []).slice(1).join(".");
    if (path && !fields.has(path)) fields.set(path, String(error.type ?? ""));
  }
  return fields;
}
