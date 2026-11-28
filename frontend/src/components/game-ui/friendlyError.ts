/**
 * Sanitizes backend or network errors so students never see raw stack traces,
 * database hostnames, ports, or internal technical details.
 */
export function toFriendlyStudentError(
  err: unknown,
  fallback = 'Something went wrong while loading your adventure. Please try again.',
): string {
  if (!(err instanceof Error)) return fallback;
  const msg = err.message.trim();
  if (!msg) return fallback;

  const lower = msg.toLowerCase();
  const looksTechnical =
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('etimedout') ||
    lower.includes('localhost') ||
    lower.includes('127.0.0.1') ||
    lower.includes('mongodb') ||
    lower.includes('postgres') ||
    lower.includes('prisma') ||
    lower.includes('sql') ||
    lower.includes('stack') ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('request failed with status 5');

  if (looksTechnical) {
    return fallback;
  }

  return msg;
}
