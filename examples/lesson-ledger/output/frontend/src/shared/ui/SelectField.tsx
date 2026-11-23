import type { Ref } from "react";
import { controlClass, FIELD, FIELD_ERROR, LABEL } from "./fieldStyles";

interface SelectFieldProps {
  id: string;
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  ref?: Ref<HTMLSelectElement>;
}

/** Labelled select whose first option (value "") is the placeholder; the error is associated
 * through aria-describedby, as in TextField. */
export function SelectField({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
  error,
  ref,
}: SelectFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={FIELD}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <select
        id={id}
        name={id}
        ref={ref}
        value={value}
        className={controlClass(Boolean(error))}
        aria-describedby={errorId}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className={FIELD_ERROR}>
          {error}
        </p>
      )}
    </div>
  );
}
