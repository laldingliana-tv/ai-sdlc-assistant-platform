// Orchestration owner: LangGraph

/**
 * Classifies whether an error is retryable based on common transient failure patterns.
 * Rate limits, timeouts, and service unavailability are considered retryable.
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('rate limit') || msg.includes('429')) return true;
    if (msg.includes('timeout') || msg.includes('timed out')) return true;
    if (msg.includes('503') || msg.includes('service unavailable')) return true;
    if (msg.includes('overloaded')) return true;
  }
  return false;
}
