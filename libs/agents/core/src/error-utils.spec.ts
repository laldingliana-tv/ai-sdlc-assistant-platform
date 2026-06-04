// Orchestration owner: LangGraph
import { describe, it, expect } from 'vitest';

import { isRetryableError } from './error-utils.js';

describe('isRetryableError', () => {
  it('should return true for rate limit errors', () => {
    expect(isRetryableError(new Error('Rate limit exceeded'))).toBe(true);
    expect(isRetryableError(new Error('HTTP 429 Too Many Requests'))).toBe(true);
  });

  it('should return true for timeout errors', () => {
    expect(isRetryableError(new Error('Connection timeout'))).toBe(true);
    expect(isRetryableError(new Error('Request timed out'))).toBe(true);
  });

  it('should return true for service unavailable errors', () => {
    expect(isRetryableError(new Error('503 Service Unavailable'))).toBe(true);
    expect(isRetryableError(new Error('service unavailable'))).toBe(true);
  });

  it('should return true for overloaded errors', () => {
    expect(isRetryableError(new Error('Model overloaded'))).toBe(true);
  });

  it('should return false for non-retryable errors', () => {
    expect(isRetryableError(new Error('Invalid API key'))).toBe(false);
    expect(isRetryableError(new Error('Permission denied'))).toBe(false);
    expect(isRetryableError(new Error('Bad request'))).toBe(false);
  });

  it('should return false for non-Error values', () => {
    expect(isRetryableError('some string')).toBe(false);
    expect(isRetryableError(null)).toBe(false);
    expect(isRetryableError(undefined)).toBe(false);
    expect(isRetryableError(42)).toBe(false);
  });
});
