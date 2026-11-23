import type { Ref } from "react";
import { controlClass, FIELD, FIELD_ERROR, HINT, LABEL } from "./fieldStyles";

interface TextFieldProps {
  id: string;
  label: string;
  type: "email" | "password" | "text" | "date";
  autoComplete?: string;
  inputMode?: "numeric" | "decimal";
  min?: string;
  max?: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
}

/** Labelled input whose hint and error are associated through aria-describedby. */
export function TextField({ id, label, hint, error, onChange, ref, ...input }: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={FIELD}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {hint && (
        <p id={hintId} className={HINT}>
          {hint}
        </p>
      )}
      <input
        {...input}
        id={id}
        ref={ref}
        name={id}
        className={controlClass(Boolean(error))}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <p id={errorId} className={FIELD_ERROR}>
          {error}
        </p>
      )}
    </div>
  );
}
