/** Client copy of the server's rules (spec Behavior: Email rules, Password rules). */

const EMAIL_MIN_LENGTH = 3;
const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;

export function isValidEmail(raw: string): boolean {
  const email = raw.trim();
  if (email.length < EMAIL_MIN_LENGTH || email.length > EMAIL_MAX_LENGTH) return false;
  if (/\s/.test(email)) return false;
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const [local = "", domain = ""] = parts;
  return local.length > 0 && domain.slice(1, -1).includes(".");
}

/** Length in Unicode code points, as the server counts it. */
export function isValidSignupPassword(password: string): boolean {
  const length = [...password].length;
  return length >= PASSWORD_MIN_LENGTH && length <= PASSWORD_MAX_LENGTH;
}
