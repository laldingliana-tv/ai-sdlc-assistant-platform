// Orchestration owner: LangGraph
import type { ZodSchema } from 'zod';

export interface ParseStructuredOutputOptions {
  /** Called when parsing or validation fails, for observability */
  onParseFailure?: (detail: { raw: string; error: string }) => void;
}

/**
 * Attempts to parse an LLM response string as JSON and validate it against a Zod schema.
 * Returns the parsed and validated result, or null if parsing/validation fails.
 *
 * This enables a graceful fallback: if the model doesn't produce valid JSON,
 * agents still return the raw string in `AgentResult.content`.
 */
export function parseStructuredOutput<T>(
  content: string,
  schema: ZodSchema<T>,
  options?: ParseStructuredOutputOptions,
): T | null {
  try {
    // Extract JSON from markdown code fences if present (handles json, jsonc, json5 specifiers)
    const fenceMatch = content.match(/```(?:json[c5]?)?\s*\n([\s\S]*?)\n```/i);
    const jsonStr = fenceMatch ? fenceMatch[1] : content.trim();

    const parsed = JSON.parse(jsonStr);
    const result = schema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }

    const errorDetail = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    options?.onParseFailure?.({
      raw: content.slice(0, 200),
      error: `Validation failed: ${errorDetail}`,
    });
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parse error';
    options?.onParseFailure?.({ raw: content.slice(0, 200), error: message });
    return null;
  }
}
