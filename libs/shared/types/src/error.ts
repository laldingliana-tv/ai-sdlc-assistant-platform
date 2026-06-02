/**
 * Shared error types and Result type for typed error handling.
 */

export interface AppError {
  code: string;
  message: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  stack?: string;
}

export type Result<T, E = AppError> = { success: true; data: T } | { success: false; error: E };

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E = AppError>(error: E): Result<never, E> {
  return { success: false, error };
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'WORKFLOW_ERROR'
  | 'AGENT_ERROR'
  | 'MCP_ERROR'
  | 'TIMEOUT';
