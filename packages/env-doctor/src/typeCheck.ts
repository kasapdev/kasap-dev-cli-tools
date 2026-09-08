export type ApparentType = "number" | "boolean" | "url" | "unknown";

const NUMBER_RE = /^-?\d+(\.\d+)?$/;
const BOOLEAN_RE = /^(true|false)$/i;
const URL_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/\S+$/;

/**
 * Infers the "apparent type" of a raw env value from its shape, i.e. what
 * kind of value it looks like it's meant to hold. Used to spot a value in
 * `.env` that doesn't match the shape implied by its `.env.example`
 * counterpart (e.g. the example shows `PORT=3000` but `.env` has
 * `PORT=please-set-me`).
 *
 * Checks are ordered so an unambiguous match wins: a bare "true"/"false"
 * is never also a number, and a value containing "://" is never also a
 * plain number or boolean.
 */
export function inferApparentType(value: string): ApparentType {
  if (BOOLEAN_RE.test(value)) return "boolean";
  if (NUMBER_RE.test(value)) return "number";
  if (URL_RE.test(value)) return "url";
  return "unknown";
}

/** Returns true if `value` matches the shape of the given apparent type. */
export function matchesApparentType(value: string, type: ApparentType): boolean {
  if (type === "unknown") return true;
  return inferApparentType(value) === type;
}
