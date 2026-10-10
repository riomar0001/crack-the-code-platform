/**
 * Renders a thrown value into something worth reading in a log.
 *
 * Supabase and PostgREST reject with plain objects rather than `Error`
 * instances, which most loggers render as `{}` — losing the one thing you
 * need. This pulls out the fields that identify the problem.
 */
export function describeError(error: unknown): string {
  if (error instanceof Error) return error.stack ?? error.message;

  if (error && typeof error === "object") {
    const { code, message, details, hint } = error as Record<string, unknown>;

    if (message || code) {
      return [
        code && `[${code}]`,
        message,
        details && `details: ${details}`,
        hint && `hint: ${hint}`,
      ]
        .filter(Boolean)
        .join(" ");
    }
  }

  return String(error);
}
