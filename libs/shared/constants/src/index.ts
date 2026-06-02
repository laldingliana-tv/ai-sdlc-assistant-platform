/**
 * Shared constants for the AI SDLC platform.
 */

// Agent names used across the platform
export const AGENT_NAMES = {
  PLANNER: 'planner',
  RETRIEVER: 'retriever',
  REVIEWER: 'reviewer',
  ARCHITECTURE: 'architecture',
  IMPLEMENTOR: 'implementor',
} as const;

// Task statuses
export const TASK_STATUSES = {
  PENDING: 'pending',
  PLANNING: 'planning',
  RETRIEVING: 'retrieving',
  REVIEWING_ARCHITECTURE: 'reviewing_architecture',
  AWAITING_APPROVAL: 'awaiting_approval',
  IMPLEMENTING: 'implementing',
  REVIEWING: 'reviewing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

// Workflow steps in execution order
export const WORKFLOW_STEPS = [
  'planning',
  'retrieval',
  'architecture_review',
  'approval_gate',
  'implementation',
  'review',
  'finalization',
] as const;

// Governance policy names
export const POLICY_NAMES = {
  APPROVAL_REQUIRED: 'approval-required',
  SCOPE_BOUNDARY: 'scope-boundary',
} as const;

// Temporal configuration constants
export const TEMPORAL = {
  DEFAULT_TASK_QUEUE: 'ai-sdlc-tasks',
  DEFAULT_NAMESPACE: 'default',
  WORKFLOW_ID_PREFIX: 'sdlc-task',
  APPROVAL_TIMEOUT_MS: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// MCP provider identifiers
export const MCP_PROVIDERS = {
  GITHUB: 'github',
  JIRA: 'jira',
  DOCS: 'docs',
} as const;

// Evaluation criteria
export const EVALUATION_CRITERIA = {
  RELEVANCE: 'relevance',
  QUALITY: 'quality',
  COMPLETENESS: 'completeness',
  ACCURACY: 'accuracy',
  COHERENCE: 'coherence',
} as const;

// API defaults
export const API_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  RATE_LIMIT_MAX: 100,
  RATE_LIMIT_WINDOW_MS: 60_000,
} as const;
