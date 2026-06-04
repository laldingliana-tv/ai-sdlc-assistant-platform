// Orchestration owner: LangGraph
import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';

import { parseStructuredOutput } from './structured-output.js';

const TestSchema = z.object({
  agent: z.literal('test'),
  value: z.number(),
  items: z.array(z.string()),
});

describe('parseStructuredOutput', () => {
  it('should parse valid JSON matching schema', () => {
    const input = JSON.stringify({ agent: 'test', value: 42, items: ['a', 'b'] });
    const result = parseStructuredOutput(input, TestSchema);

    expect(result).toEqual({ agent: 'test', value: 42, items: ['a', 'b'] });
  });

  it('should return null for invalid JSON', () => {
    const result = parseStructuredOutput('not valid json', TestSchema);
    expect(result).toBeNull();
  });

  it('should return null when JSON does not match schema', () => {
    const input = JSON.stringify({ agent: 'wrong', value: 'string' });
    const result = parseStructuredOutput(input, TestSchema);
    expect(result).toBeNull();
  });

  it('should strip markdown code fences', () => {
    const input = '```json\n{"agent":"test","value":1,"items":["x"]}\n```';
    const result = parseStructuredOutput(input, TestSchema);

    expect(result).toEqual({ agent: 'test', value: 1, items: ['x'] });
  });

  it('should handle code fences without language specifier', () => {
    const input = '```\n{"agent":"test","value":5,"items":[]}\n```';
    const result = parseStructuredOutput(input, TestSchema);

    expect(result).toEqual({ agent: 'test', value: 5, items: [] });
  });

  it('should handle jsonc and json5 code fence specifiers', () => {
    const inputJsonc = '```jsonc\n{"agent":"test","value":7,"items":["y"]}\n```';
    expect(parseStructuredOutput(inputJsonc, TestSchema)).toEqual({
      agent: 'test',
      value: 7,
      items: ['y'],
    });

    const inputJson5 = '```json5\n{"agent":"test","value":8,"items":["z"]}\n```';
    expect(parseStructuredOutput(inputJson5, TestSchema)).toEqual({
      agent: 'test',
      value: 8,
      items: ['z'],
    });
  });

  it('should handle leading/trailing text around fences', () => {
    const input =
      'Here is the output:\n```json\n{"agent":"test","value":3,"items":["q"]}\n```\nDone.';
    const result = parseStructuredOutput(input, TestSchema);

    expect(result).toEqual({ agent: 'test', value: 3, items: ['q'] });
  });

  it('should return null for empty string', () => {
    const result = parseStructuredOutput('', TestSchema);
    expect(result).toBeNull();
  });

  it('should handle whitespace around JSON', () => {
    const input = '  \n {"agent":"test","value":10,"items":["c"]}  \n ';
    const result = parseStructuredOutput(input, TestSchema);

    expect(result).toEqual({ agent: 'test', value: 10, items: ['c'] });
  });

  it('should call onParseFailure callback on validation failure', () => {
    const onParseFailure = vi.fn();
    const input = JSON.stringify({ agent: 'wrong', value: 'string' });
    const result = parseStructuredOutput(input, TestSchema, { onParseFailure });

    expect(result).toBeNull();
    expect(onParseFailure).toHaveBeenCalledOnce();
    expect(onParseFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Validation failed'),
      }),
    );
  });

  it('should call onParseFailure callback on JSON parse error', () => {
    const onParseFailure = vi.fn();
    const result = parseStructuredOutput('not json at all', TestSchema, { onParseFailure });

    expect(result).toBeNull();
    expect(onParseFailure).toHaveBeenCalledOnce();
    expect(onParseFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        raw: expect.any(String),
        error: expect.any(String),
      }),
    );
  });
});
