import type { ProfileMapping } from '../interfaces/model-config.interface.js';

export const DEFAULT_PROFILES: ProfileMapping[] = [
  {
    profileName: 'planning',
    primaryModelId: 'claude-4-sonnet',
    temperature: 0.3,
    maxTokens: 4096,
  },
  {
    profileName: 'coding',
    primaryModelId: 'claude-4-sonnet',
    temperature: 0.1,
    maxTokens: 8192,
  },
  {
    profileName: 'review',
    primaryModelId: 'gpt-4.1',
    temperature: 0.2,
    maxTokens: 4096,
  },
  {
    profileName: 'retrieval',
    primaryModelId: 'gemini-2.5-flash',
    temperature: 0.0,
    maxTokens: 2048,
  },
  {
    profileName: 'summarization',
    primaryModelId: 'gemini-2.5-flash',
    temperature: 0.1,
    maxTokens: 1024,
  },
];
