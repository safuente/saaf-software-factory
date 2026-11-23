/** Student name rule of the F02 spec (Behavior: Student name), as enforced by the backend. */

export const NAME_MESSAGES = {
  required: "Enter the student's name.",
  tooLong: "Name must be 100 characters or fewer.",
  control: "Name can't contain tabs or line breaks.",
};

const NAME_MAX_LENGTH = 100;
const CONTROL_CHARACTER = /\p{Cc}/u;

/** The message for an invalid name, or undefined. Length counts Unicode code points. */
export function nameError(raw: string): string | undefined {
  const name = raw.trim();
  if (!name) return NAME_MESSAGES.required;
  if ([...name].length > NAME_MAX_LENGTH) return NAME_MESSAGES.tooLong;
  if (CONTROL_CHARACTER.test(name)) return NAME_MESSAGES.control;
  return undefined;
}

/** The client message for the backend's 422 error type on `name`. */
export function nameMessageForServerError(type: string): string {
  if (type === "name_too_long" || type === "string_too_long") return NAME_MESSAGES.tooLong;
  if (type === "name_control_characters") return NAME_MESSAGES.control;
  return NAME_MESSAGES.required;
}
