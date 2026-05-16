/**
 * Converts an ISO 8601 / UTC timestamp string (as stored in the database)
 * to the `YYYY-MM-DDTHH:mm` format required by HTML `<input type="datetime-local">`.
 *
 * Returns an empty string if the input is null, undefined, or unparseable.
 */
export function toLocalDatetimeString(isoString?: string | null): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    // Produce a local-timezone YYYY-MM-DDTHH:mm string
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      "T" +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes())
    );
  } catch {
    return "";
  }
}

/**
 * Converts a `datetime-local` input value (`YYYY-MM-DDTHH:mm`) to a full
 * RFC 3339 / ISO 8601 string (e.g. `2026-05-16T07:30:00.000Z`).
 *
 * Returns null if the input is empty or unparseable.
 */
export function toISOString(datetimeLocalValue?: string | null): string | null {
  if (!datetimeLocalValue) return null;
  try {
    const d = new Date(datetimeLocalValue);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}
